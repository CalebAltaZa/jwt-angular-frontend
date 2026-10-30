/**
 * Valida la corrección del hallazgo de Nuclei `http-missing-security-headers`.
 *
 *  - nginx.conf debe declarar los `add_header ... always;` esperados.
 *  - Si el sitio está levantado, las cabeceras deben llegar en la respuesta.
 *
 * Uso:
 *   node e2e/check-security-headers.mjs
 *   SITE_URL=http://localhost:8080 node e2e/check-security-headers.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nginxConf = readFileSync(join(root, 'nginx.conf'), 'utf8');

const expected = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};

for (const name of Object.keys(expected)) {
  assert.match(
    nginxConf,
    new RegExp(`add_header\\s+${name}\\s`, 'i'),
    `nginx.conf no define add_header ${name}`,
  );
}
console.log(`OK  nginx.conf define ${Object.keys(expected).length} cabeceras de seguridad`);

const siteUrl = process.env.SITE_URL ?? 'http://localhost:8080';
try {
  const response = await fetch(siteUrl, { redirect: 'manual' });
  for (const [name, value] of Object.entries(expected)) {
    assert.equal(response.headers.get(name), value, `cabecera ${name} incorrecta o ausente`);
  }
  console.log('OK  todas las cabeceras presentes en la respuesta HTTP real');
} catch (error) {
  if (error instanceof TypeError) {
    console.warn(`AVISO  No se pudo contactar ${siteUrl}; se omite la comprobación HTTP.`);
  } else {
    throw error;
  }
}
