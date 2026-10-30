/**
 * Valida la corrección del hallazgo de Nuclei `nginx-version`.
 *
 *  - nginx.conf debe declarar `server_tokens off;`.
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

assert.match(
  nginxConf,
  /server_tokens\s+off\s*;/,
  'nginx.conf debe contener "server_tokens off;"',
);
console.log('OK  nginx.conf con "server_tokens off"');

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
