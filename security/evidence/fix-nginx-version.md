# Evidencia — Versión de nginx oculta y base actualizada (jwt-angular-frontend)

Hallazgos de Nuclei: `nginx-version` (banner `nginx/1.27.5`) y `nginx-eol`
(1.27 marcado end-of-life).

## Antes

El header `Server` revelaba la versión exacta (`nginx/1.27.5`) y la imagen base
(`nginx:1.27`) estaba EOL.

## Corrección

- `nginx.conf`: `server_tokens off;` (no revela la versión ni en errores).
- `Dockerfile`: imagen base `nginx:stable-alpine`.

## Después (imagen reconstruida)

```console
$ curl -s -D - -o /dev/null http://localhost:8080/ | head -3
HTTP/1.1 200 OK
Server: nginx
Date: ...
```

El header `Server` ya no incluye versión.

## Validación automatizada

```console
$ node e2e/check-server-tokens.mjs
OK  nginx.conf con "server_tokens off" e imagen base nginx:stable-alpine
OK  header Server = "nginx" (sin versión)
```

El script comprueba `nginx.conf`, el `FROM` del `Dockerfile` y, si el sitio está
levantado, el header `Server` en vivo.
