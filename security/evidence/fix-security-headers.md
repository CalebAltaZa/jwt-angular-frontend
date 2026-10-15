# Evidencia — Cabeceras de seguridad (jwt-angular-frontend)

Hallazgo de Nuclei: `http-missing-security-headers` (×10).

## Antes

nginx servía el dashboard sin ninguna cabecera de endurecimiento.

## Corrección

`nginx.conf` añade 10 cabeceras con `add_header ... always;` (aplican también a
respuestas 4xx/5xx): CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`, `X-Permitted-Cross-Domain-Policies`, `Cross-Origin-Opener-Policy`,
`Cross-Origin-Embedder-Policy`, `Cross-Origin-Resource-Policy` y `Permissions-Policy`.

## Después (imagen reconstruida)

```console
$ curl -s -D - -o /dev/null http://localhost:8080/ | grep -iE 'x-frame|csp|strict|content-security|referrer|permissions|origin'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
X-Permitted-Cross-Domain-Policies: none
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; ...; frame-ancestors 'none'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Validación automatizada

```console
$ node e2e/check-security-headers.mjs
OK  nginx.conf define 10 cabeceras de seguridad
OK  todas las cabeceras presentes en la respuesta HTTP real
```

El script valida los `add_header` en `nginx.conf` y, si el sitio está levantado,
que cada cabecera llegue con su valor en la respuesta real.
