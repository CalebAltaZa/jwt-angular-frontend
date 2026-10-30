# Evidencia — cabecera Content-Security-Policy (jwt-angular-frontend)

Hallazgo de Nuclei: `http-missing-security-headers` (falta `Content-Security-Policy`).

## Antes

La respuesta de nginx no incluía la cabecera `Content-Security-Policy`.

## Corrección

Se añade en `nginx.conf`:

```nginx
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;
```

y su comprobación en `e2e/check-security-headers.mjs`.

## Validación

```console
$ node e2e/check-security-headers.mjs
OK  nginx.conf define 9 cabeceras de seguridad
OK  todas las cabeceras presentes en la respuesta HTTP real
```

`always` hace que la cabecera se envíe también en respuestas 4xx/5xx.
