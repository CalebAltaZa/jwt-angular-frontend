# Análisis de seguridad con Nuclei — Custom Dashboard (jwt-angular-frontend)

Análisis estático de vulnerabilidades del **dashboard Marvel** (SPA Angular servida
por nginx) usando **Nuclei** de ProjectDiscovery dentro de un contenedor Docker.

- **Fecha del análisis:** 2026-10-14
- **Objetivo escaneado:** `http://jwt-frontend:80` (contenedor `jwt-frontend`)
- **Imagen:** `projectdiscovery/nuclei:latest` (nuclei v3.11.1)
- **Plantillas:** `nuclei-templates v10.5.0` (11.154 plantillas)
- **Resultado crudo:** [`nuclei-frontend.jsonl`](nuclei-frontend.jsonl)

## Cómo se ejecutó

El contenedor de Nuclei se conectó a la **misma red Docker del stack**
(`practicajwt_app-net`) para poder resolver y alcanzar el servicio por su nombre,
sin depender de los puertos publicados en el host (bridging entre contenedores,
como pidió el docente):

```bash
# Red del stack PracticaJWT
docker network ls | grep practicajwt_app-net

# Escaneo (contenedor efímero, plantillas en volumen persistente)
docker run --rm --network practicajwt_app-net \
  -v nuclei-templates:/root/nuclei-templates \
  -v "$PWD/security/nuclei:/reports" \
  projectdiscovery/nuclei:latest \
  -target http://jwt-frontend:80 \
  -severity info,low,medium,high,critical \
  -jsonl-export /reports/nuclei-frontend.jsonl -stats -no-color
```

## Hallazgos (14)

Todas las coincidencias son de severidad **info** (el escaneo no encontró
vulnerabilidades críticas/altas explotables de caja negra).

| Severidad | Plantilla | Hallazgo |
|---|---|---|
| info | `waf-detect` | No se detecta WAF delante del frontend |
| info | `nginx-version` | Versión de servidor expuesta: **nginx/1.27.5** |
| info | `nginx-eol` | nginx 1.27.5 marcado como *end-of-life* |
| info | `tech-detect` | Fingerprinting de tecnología (nginx) |
| info | `http-missing-security-headers` (×10) | Faltan cabeceras de seguridad (ver abajo) |

### Cabeceras de seguridad ausentes en el frontend

`Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`,
`X-Content-Type-Options`, `X-Permitted-Cross-Domain-Policies`, `Referrer-Policy`,
`Cross-Origin-Opener-Policy`, `Permissions-Policy`, `Cross-Origin-Embedder-Policy`,
`Cross-Origin-Resource-Policy`.

## Interpretación

1. **Cabeceras de seguridad ausentes (principal hallazgo accionable).** El nginx
   del dashboard no añade ninguna cabecera de endurecimiento. Esto habilita
   clickjacking (`X-Frame-Options`/`CSP frame-ancestors`), MIME-sniffing
   (`X-Content-Type-Options`) y filtración de referer (`Referrer-Policy`).
   Se corrige de forma granular en `nginx.conf` con `add_header`.
2. **Fuga de versión de servidor.** `server_tokens off` elimina el banner de
   nginx en respuestas y páginas de error.
3. **Sin WAF.** Para una práctica local no es bloqueante; en producción se
   documenta como riesgo aceptado o se mitiga en el borde.

> Nota: los hallazgos del dashboard coinciden con los del backend porque nginx
> actúa como reverse-proxy; el endurecimiento real de cabeceras debe aplicarse
> además en cada servicio.

## Estado

Correcciones aplicadas, **cada una con su prueba**:

- [x] Ocultar la versión de nginx con `server_tokens off` y actualizar la imagen
      base a `nginx:stable-alpine` (nginx 1.27 EOL).
      Validado por [`e2e/check-server-tokens.mjs`](../../e2e/check-server-tokens.mjs)
      y [`security/evidence/fix-nginx-version.md`](../evidence/fix-nginx-version.md).
- [x] Cabeceras de seguridad en `nginx.conf` (CSP, HSTS, `X-Frame-Options`, ...).
      Validado por [`e2e/check-security-headers.mjs`](../../e2e/check-security-headers.mjs)
      y [`security/evidence/fix-security-headers.md`](../evidence/fix-security-headers.md).

> Tras las correcciones hay que reconstruir la imagen del frontend
> (`docker compose build frontend && docker compose up -d frontend`) y volver a
> lanzar Nuclei para confirmar que los hallazgos desaparecen.
