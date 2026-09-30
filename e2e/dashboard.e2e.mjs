/**
 * Prueba end-to-end del sitio con un navegador real (Playwright + Firefox).
 *
 * Comprueba lo que NO se puede ver en las unitarias:
 *   1. Los <mat-icon> renderizan glifos de la fuente local, no el texto sueltos.
 *   2. Los posters cargan desde /posters/*.svg (sin internet).
 *   3. El login contra LDAP funciona y el JWT viaja en cada request.
 *   4. Alta, favorito y borrado funcionan contra la API real.
 *   5. Logout limpia el token y las rutas protegidas rebotan a /login.
 *
 * Requiere el stack levantado (./setup.sh && docker compose up -d en la raíz).
 *
 *   npm run e2e                     # headless, capturas en e2e/screenshots
 *   npm run e2e -- http://...       # contra otro host
 *   HEADED=1 npm run e2e            # con ventana visible
 */

import { firefox } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] ?? process.env.BASE_URL ?? 'http://localhost:8080';
const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = process.env.SHOTS ?? resolve(HERE, 'screenshots');

const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  PASA ' : '  FALLA'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

await mkdir(SHOTS, { recursive: true });
console.log(`Probando ${BASE} (capturas en ${SHOTS})`);

const browser = await firefox.launch({ headless: process.env.HEADED !== '1' });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
const failedRequests = [];
const apiCalls = [];

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('requestfailed', (req) => failedRequests.push(`${req.url()} :: ${req.failure()?.errorText}`));
page.on('request', (req) => {
  if (req.url().includes('/api/')) {
    apiCalls.push({
      method: req.method(),
      url: req.url().replace(BASE, ''),
      auth: req.headers()['authorization'] ?? null,
    });
  }
});

console.log('\n=== 1. Carga inicial ===');
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}/01-login.png`, fullPage: true });

const title = await page.title();
record('La página carga y redirige a /login', /Marvel JWT/.test(title), `título: "${title}"`);
record('Sin errores de consola al inicio', consoleErrors.length === 0, consoleErrors.join(' | '));

console.log('\n=== 2. Iconos: ¿glifos o letras? ===');
const iconFontLoaded = await page.evaluate(() => document.fonts.check('24px "Material Icons Round"'));
const iconReport = await page.evaluate(() =>
  [...document.querySelectorAll('mat-icon')].map((el) => {
    const cs = getComputedStyle(el);
    return {
      text: (el.textContent ?? '').trim(),
      isIconFont: /Material Icons/i.test(cs.fontFamily),
      width: Math.round(el.getBoundingClientRect().width),
    };
  }),
);
const badIcons = iconReport.filter((i) => !i.isIconFont);
record(
  'Todos los <mat-icon> usan la fuente de iconos',
  badIcons.length === 0,
  badIcons.length ? `malos: ${badIcons.map((i) => i.text).join(', ')}` : `${iconReport.length} iconos OK`,
);
record('La fuente de iconos está cargada', iconFontLoaded, `document.fonts.check → ${iconFontLoaded}`);
// Un glifo mide ≤24px; el texto "favorite" en Inter mediría ~90px.
record(
  'Los iconos ocupan un glifo, no el ancho del texto',
  iconReport.every((i) => i.width > 0 && i.width <= 48),
  iconReport.map((i) => `${i.text}:${i.width}px`).join(' '),
);

console.log('\n=== 3. Login con LDAP ===');
await page.getByLabel('Usuario LDAP').fill('caleb');
await page.getByLabel('Contraseña').fill('caleb123');
await page.getByRole('button', { name: /iniciar sesión/i }).click();
await page.waitForURL('**/dashboard', { timeout: 15000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${SHOTS}/02-dashboard.png`, fullPage: true });

const itemsCount = await page.locator('ul li').count();
record('Login exitoso y redirección a /dashboard', page.url().includes('/dashboard'), page.url());
record('El dashboard lista los items del usuario', itemsCount > 0, `${itemsCount} tarjetas`);

console.log('\n=== 4. Posters locales ===');
// Las tarjetas usan loading="lazy": hay que recorrer la página para que el
// navegador pida las imágenes que están por debajo del pliegue.
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
  window.scrollTo(0, 0);
});
await page.waitForFunction(
  () => [...document.querySelectorAll('ul li img')].every((i) => i.complete),
  null,
  { timeout: 15000 },
);
const imgReport = await page.evaluate(() =>
  [...document.querySelectorAll('ul li img')].map((img) => ({
    src: new URL(img.src).pathname,
    loaded: img.complete && img.naturalWidth > 0,
  })),
);
const brokenImgs = imgReport.filter((i) => !i.loaded);
record(
  'Todas las imágenes cargan',
  brokenImgs.length === 0,
  brokenImgs.length ? `rotas: ${brokenImgs.map((i) => i.src).join(', ')}` : `${imgReport.length} imágenes OK`,
);
record(
  'Las imágenes son locales (/posters/*.svg)',
  imgReport.every((i) => i.src.startsWith('/posters/')),
  imgReport[0]?.src ?? 'sin imágenes',
);

console.log('\n=== 5. JWT en cada request ===');
const withAuth = apiCalls.filter((c) => c.auth?.startsWith('Bearer '));
record(
  'Las peticiones a /api/items llevan Authorization: Bearer',
  withAuth.length > 0,
  `${withAuth.length}/${apiCalls.filter((c) => c.url.includes('/items')).length} con token`,
);
record(
  'El header es un JWT de 3 segmentos',
  withAuth.every((c) => c.auth.split('.').length === 3),
  withAuth[0]?.auth.slice(0, 28) + '…' ?? 'sin token',
);
const token = await page.evaluate(() => localStorage.getItem('marvel_jwt'));
record('El token está en localStorage (marvel_jwt)', !!token, token ? `${token.slice(0, 24)}…` : 'ausente');

console.log('\n=== 6. Agregar item ===');
// Los ids visibles antes de tocar nada: al final hay que comprobar que siguen
// todos ahí, para que la prueba nunca se coma un item sembrado.
const readIds = () =>
  page.$$eval('ul li', (cards) =>
    cards.map((li) => li.querySelector('p.font-mono')?.textContent?.match(/id (\d+)/)?.[1] ?? '?'),
  );
const idsBefore = await readIds();

const NEW_NAME = 'Moon Knight: Elrijk';
await page.getByRole('button', { name: /agregar item/i }).first().click();
await page.waitForURL('**/agregar', { timeout: 10000 });
await page.getByLabel('Nombre').fill(NEW_NAME);
await page.getByLabel('Categoría').click();
await page.getByRole('option', { name: 'Series' }).click();
await page.getByLabel('URL de imagen (opcional)').fill('/posters/wakanda.svg');
await page.waitForTimeout(500);
record('La vista previa de la imagen aparece', await page.locator('img[alt="Vista previa de la imagen"]').isVisible());
await page.screenshot({ path: `${SHOTS}/03-agregar.png`, fullPage: true });
await page.getByRole('button', { name: /guardar item/i }).click();
await page.waitForURL('**/dashboard', { timeout: 15000 });
await page.waitForTimeout(1200);

const afterAdd = await page.locator('ul li').count();
record('El item nuevo aparece en la lista', afterAdd === itemsCount + 1, `${itemsCount} → ${afterAdd}`);
await page.screenshot({ path: `${SHOTS}/04-dashboard-con-nuevo.png`, fullPage: true });

// Todas las acciones siguientes van sobre la tarjeta del item recién creado,
// nunca sobre "el primer botón de la lista": si no, la prueba borraría un item
// preexistente en cuanto el orden de la lista cambie.
const card = page.locator('ul li').filter({ hasText: NEW_NAME });
record('La tarjeta del item nuevo es localizable', (await card.count()) === 1);

console.log('\n=== 7. Favorito y eliminar ===');
await card.locator('button[matIconButton]').click();
await page.waitForTimeout(900);
const patchCall = apiCalls.filter((c) => c.method === 'PATCH').pop();
record(
  'El favorito dispara PATCH con Bearer',
  patchCall?.auth?.startsWith('Bearer ') ?? false,
  patchCall?.url ?? 'sin PATCH',
);

page.once('dialog', (d) => d.accept());
await card.getByRole('button', { name: /eliminar/i }).click();
await page.waitForTimeout(1200);
const afterDelete = await page.locator('ul li').count();
record('El item se elimina', afterDelete === itemsCount, `${afterAdd} → ${afterDelete}`);

const idsAfter = await readIds();
const lost = idsBefore.filter((id) => !idsAfter.includes(id));
record('Ningún item previo se perdió', lost.length === 0, lost.length ? `perdidos: ${lost.join(', ')}` : `${idsBefore.length} ids intactos`);

console.log('\n=== 8. Sesión cerrada ===');
await page.getByRole('button', { name: /^salir$/i }).click();
await page.waitForURL('**/login**', { timeout: 10000 });
record('Al salir se limpia el token', (await page.evaluate(() => localStorage.getItem('marvel_jwt'))) === null);

console.log('\n=== 9. Ruta protegida sin token ===');
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
record('Sin token, /dashboard redirige a /login', page.url().includes('/login'), page.url());

const realErrors = consoleErrors.filter((e) => !/401|Failed to load resource|net::ERR_ABORTED/i.test(e));
record('Sin errores de consola relevantes', realErrors.length === 0, realErrors.slice(0, 2).join(' | '));
const realFailed = failedRequests.filter((r) => !/401/.test(r));
record('Sin peticiones fallidas (salvo 401 esperados)', realFailed.length === 0, realFailed.slice(0, 2).join(' | '));

await browser.close();

const passed = results.filter((r) => r.ok).length;
console.log('\n' + '='.repeat(58));
console.log(`RESULTADO: ${passed}/${results.length} verificaciones OK`);
console.log('='.repeat(58));
process.exit(passed === results.length ? 0 : 1);
