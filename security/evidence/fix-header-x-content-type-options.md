# Evidencia — cabecera X-Content-Type-Options (jwt-angular-frontend)

Hallazgo de Nuclei: `http-missing-security-headers` (falta `X-Content-Type-Options`).

## Antes

La respuesta de nginx no incluía la cabecera `X-Content-Type-Options`.

## Corrección

Se añade en `nginx.conf`:

```nginx
add_header X-Content-Type-Options "nosniff" always;
```

y su comprobación en `e2e/check-security-headers.mjs`.

## Validación

```console
$ node e2e/check-security-headers.mjs
OK  nginx.conf define 1 cabeceras de seguridad
OK  todas las cabeceras presentes en la respuesta HTTP real
```

`always` hace que la cabecera se envíe también en respuestas 4xx/5xx.
