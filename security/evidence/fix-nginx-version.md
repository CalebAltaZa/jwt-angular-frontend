# Evidencia — Versión de nginx oculta (jwt-angular-frontend)

Hallazgo de Nuclei: `nginx-version` (banner `nginx/1.27.5`).

## Antes

El header `Server` revelaba la versión exacta (`nginx/1.27.5`).

## Corrección

`nginx.conf`: `server_tokens off;` (no revela la versión ni en respuestas ni en
páginas de error).

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
OK  nginx.conf con "server_tokens off"
OK  header Server = "nginx" (sin versión)
```

El script comprueba `nginx.conf` y, si el sitio está levantado, el header
`Server` en vivo.
