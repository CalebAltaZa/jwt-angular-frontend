# Validación en vivo — frontend (jwt-angular-frontend)

Fecha: 2026-10-29. Stack reconstruido con `./setup.sh`
(`docker compose up --build -d`) a partir de los commits de corrección.

## Scripts e2e

```console
$ node e2e/check-server-tokens.mjs
OK  nginx.conf con "server_tokens off"
OK  header Server = "nginx" (sin versión)

$ node e2e/check-nginx-image.mjs
OK  Dockerfile con imagen base soportada: nginx:stable-alpine

$ node e2e/check-security-headers.mjs
OK  nginx.conf define 10 cabeceras de seguridad
OK  todas las cabeceras presentes en la respuesta HTTP real
```

## Respuesta HTTP real (`http://localhost:8080/`)

```console
$ curl -sI http://localhost:8080/ | grep -iE '^(server|strict|content-security|x-frame|x-content-type|x-permitted|referrer|cross-origin|permissions):'
Server: nginx
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
X-Permitted-Cross-Domain-Policies: none
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

`Server` no incluye la versión y están presentes las 10 cabeceras de seguridad.
