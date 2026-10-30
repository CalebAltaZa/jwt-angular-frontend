# Evidencia — Imagen base actualizada (jwt-angular-frontend)

Hallazgo de Nuclei: `nginx-eol` (nginx 1.27 marcado end-of-life).

## Antes

El `Dockerfile` usaba `FROM nginx:1.27-alpine`, una versión EOL.

## Corrección

`Dockerfile`: `FROM nginx:stable-alpine` (versión soportada).

## Después

```console
$ grep '^FROM nginx' Dockerfile
FROM nginx:stable-alpine
```

## Validación automatizada

```console
$ node e2e/check-nginx-image.mjs
OK  Dockerfile con imagen base soportada: nginx:stable-alpine
```

El script valida el `FROM` del `Dockerfile` y falla si el tag es EOL o `latest`.
