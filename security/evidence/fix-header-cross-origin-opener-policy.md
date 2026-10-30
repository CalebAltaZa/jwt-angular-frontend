# Evidencia — cabecera Cross-Origin-Opener-Policy (jwt-angular-frontend)

Hallazgo de Nuclei: `http-missing-security-headers` (falta `Cross-Origin-Opener-Policy`).

## Antes

La respuesta de nginx no incluía la cabecera `Cross-Origin-Opener-Policy`.

## Corrección

Se añade en `nginx.conf`:

```nginx
add_header Cross-Origin-Opener-Policy "same-origin" always;
```

y su comprobación en `e2e/check-security-headers.mjs`.

## Validación

```console
$ node e2e/check-security-headers.mjs
OK  nginx.conf define 5 cabeceras de seguridad
OK  todas las cabeceras presentes en la respuesta HTTP real
```

`always` hace que la cabecera se envíe también en respuestas 4xx/5xx.
