# Evidencia — cabecera Strict-Transport-Security (jwt-angular-frontend)

Hallazgo de Nuclei: `http-missing-security-headers` (falta `Strict-Transport-Security`).

## Antes

La respuesta de nginx no incluía la cabecera `Strict-Transport-Security`.

## Corrección

Se añade en `nginx.conf`:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

y su comprobación en `e2e/check-security-headers.mjs`.

## Validación

```console
$ node e2e/check-security-headers.mjs
OK  nginx.conf define 10 cabeceras de seguridad
OK  todas las cabeceras presentes en la respuesta HTTP real
```

`always` hace que la cabecera se envíe también en respuestas 4xx/5xx.
