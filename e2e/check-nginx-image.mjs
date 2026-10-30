/**
 * Valida la corrección del hallazgo de Nuclei `nginx-eol`.
 *
 *  - El Dockerfile no debe usar una imagen con versión EOL (p. ej. nginx:1.27).
 *  - No debe fijarse la imagen `latest` sin versión.
 *
 * Uso:
 *   node e2e/check-nginx-image.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dockerfile = readFileSync(join(root, 'Dockerfile'), 'utf8');

const fromMatch = dockerfile.match(/^FROM\s+nginx:(\S+)/m);
assert.ok(fromMatch, 'No se encontró una etapa "FROM nginx:<tag>" en el Dockerfile');
const tag = fromMatch[1];
assert.notEqual(tag, 'latest', 'No usar la imagen nginx:latest (sin versión fija)');
assert.ok(
  !/^1\.(2[0-7])(\.|$)/.test(tag),
  `nginx:${tag} está end-of-life; usar una imagen soportada`,
);
console.log(`OK  Dockerfile con imagen base soportada: nginx:${tag}`);
