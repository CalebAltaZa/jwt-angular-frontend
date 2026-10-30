# Evidencia — cabecera Permissions-Policy (jwt-angular-frontend)

Hallazgo de Nuclei: `http-missing-security-headers` (falta `Permissions-Policy`).

## Antes

La respuesta de nginx no incluía la cabecera `Permissions-Policy`.

## Corrección

Se añade en `nginx.conf`:

```nginx
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

y su comprobación en `e2e/check-security-headers.mjs`.

## Validación

```console
$ node e2e/check-security-headers.mjs
OK  nginx.conf define 8 cabeceras de seguridad
OK  todas las cabeceras presentes en la respuesta HTTP real
```

`always` hace que la cabecera se envíe también en respuestas 4xx/5xx.
