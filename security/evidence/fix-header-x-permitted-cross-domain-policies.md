# Evidencia — cabecera X-Permitted-Cross-Domain-Policies (jwt-angular-frontend)

Hallazgo de Nuclei: `http-missing-security-headers` (falta `X-Permitted-Cross-Domain-Policies`).

## Antes

La respuesta de nginx no incluía la cabecera `X-Permitted-Cross-Domain-Policies`.

## Corrección

Se añade en `nginx.conf`:

```nginx
add_header X-Permitted-Cross-Domain-Policies "none" always;
```

y su comprobación en `e2e/check-security-headers.mjs`.

## Validación

```console
$ node e2e/check-security-headers.mjs
OK  nginx.conf define 4 cabeceras de seguridad
OK  todas las cabeceras presentes en la respuesta HTTP real
```

`always` hace que la cabecera se envíe también en respuestas 4xx/5xx.
