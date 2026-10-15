/**
 * Valida la corrección de los hallazgos de Nuclei `nginx-version` y `nginx-eol`.
 *
 *  - nginx.conf debe declarar `server_tokens off;`.
 *  - El Dockerfile no debe usar una imagen con versión EOL (p. ej. nginx:1.27).
 *  - Si el sitio está levantado, el header `Server` no puede llevar versión.
 *
 * Uso:
 *   node e2e/check-server-tokens.mjs
 *   SITE_URL=http://localhost:8080 node e2e/check-server-tokens.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nginxConf = readFileSync(join(root, 'nginx.conf'), 'utf8');
const dockerfile = readFileSync(join(root, 'Dockerfile'), 'utf8');

assert.match(
  nginxConf,
  /server_tokens\s+off\s*;/,
  'nginx.conf debe contener "server_tokens off;"',
);

const fromMatch = dockerfile.match(/^FROM\s+nginx:(\S+)/m);
assert.ok(fromMatch, 'No se encontró una etapa "FROM nginx:<tag>" en el Dockerfile');
const tag = fromMatch[1];
assert.notEqual(tag, 'latest', 'No usar la imagen nginx:latest (sin versión fija)');
assert.ok(
  !/^1\.(2[0-7])(\.|$)/.test(tag),
  `nginx:${tag} está end-of-life; usar una imagen soportada`,
);
console.log(`OK  nginx.conf con "server_tokens off" e imagen base nginx:${tag}`);

const siteUrl = process.env.SITE_URL ?? 'http://localhost:8080';
try {
  const response = await fetch(siteUrl, { redirect: 'manual' });
  const server = response.headers.get('server') ?? '';
  assert.ok(!/\d/.test(server), `El header Server revela la versión: "${server}"`);
  console.log(`OK  header Server = "${server}" (sin versión)`);
} catch (error) {
  if (error instanceof TypeError) {
    console.warn(`AVISO  No se pudo contactar ${siteUrl}; se omite la comprobación HTTP.`);
  } else {
    throw error;
  }
}
