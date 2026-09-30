# jwt-angular-frontend

Dashboard Marvel: login contra la API de LDAP, lista de items del usuario y alta
de nuevos items. El JWT se guarda en el navegador y un **interceptor funcional**
lo inyecta automaticamente en todas las peticiones.

## Stack

| Pieza | Version / detalle |
| --- | --- |
| Angular | 22 (standalone, signals, control flow `@if` / `@for`) |
| HTTP | `provideHttpClient(withInterceptors([authInterceptor]))` |
| JWT | `@auth0/angular-jwt` (lectura de claims y expiracion) |
| UI | Angular Material 22 (tema M3) + Tailwind CSS 4 |
| Build | multi-stage: Node 22 compila, nginx 1.27 sirve y hace de reverse proxy |

## Pantallas

| Ruta | Vista | Protegida |
| --- | --- | --- |
| `/login` | Validar usuario LDAP y obtener el token | no |
| `/dashboard` | Lista inicial de items, buscador, filtro por categoría, favorito y eliminar | si |
| `/agregar` | Alta de item (nombre, categoría, URL de imagen, nota) con vista previa | si |

## El interceptor (lo importante)

`src/app/core/auth.interceptor.ts`

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(TokenStorage);
  const token = storage.get();

  const authorized = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  console.log(`[JWT] ${authorized.method} ${authorized.url}  Authorization: Bearer ${token}`);

  return next(authorized).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && token) {
        storage.clear();                       // el token expiró o fue rechazado
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
```

Se registra en `src/app/app.config.ts`:

```ts
provideHttpClient(withInterceptors([authInterceptor])),
```

Detalles de diseno:

- **Functional interceptor**: es la API moderna; el interceptor con clase quedo
  obsoleto.
- El token vive en un **signal** dentro de `TokenStorage`, no solo en
  `localStorage`: cuando el interceptor lo limpia ante un `401`, el guard, la
  navbar y la vista se actualizan solos.
- El interceptor **no** inyecta `AuthService` a proposito (que usa `HttpClient`):
  eso crearia una dependencia ciclica.
- Las rutas protegidas usan `CanActivateFn` (`authGuard`), no `CanActivate`.

## Estructura

```
src/app/
├── app.config.ts              providers: router, http + interceptor, animaciones, JwtModule
├── app.routes.ts              rutas lazy con authGuard
├── core/
│   ├── models.ts              contratos con las APIs (Item, LoginResponse, JwtClaims…)
│   ├── token-storage.ts       signal + localStorage
│   ├── auth.service.ts        login/logout y claims del token
│   ├── auth.interceptor.ts    HttpInterceptorFn
│   ├── auth.guard.ts          CanActivateFn
│   └── items.service.ts       llamadas a la API de items
└── features/
    ├── login/                 login.ts + login.html
    ├── dashboard/             dashboard.ts + dashboard.html
    └── add-item/              add-item.ts + add-item.html
```

## Correr con Docker (recomendado)

Levanta el stack completo (frontend + auth + items + LDAP):

```bash
cd ..
./setup.sh
# http://localhost:8080
```

Sólo el frontend, si los backends ya corren:

```bash
docker build -t jwt-angular-frontend .
docker run --rm -p 8080:80 jwt-angular-frontend
```

nginx hace de reverse proxy para que el navegador use un solo origen:

| Ruta | Va a |
| --- | --- |
| `/api/auth/*` | `auth:8000/auth/*` |
| `/api/items/*` | `items:8001/items/*` |
| `/` | SPA (con `try_files … /index.html`) |

## Desarrollo local

```bash
npm install
npm start          # ng serve --proxy-config proxy.conf.json
```

`proxy.conf.json` redirige `/api/auth` a `localhost:8000` y `/api/items` a
`localhost:8001`, asi el codigo es identico en dev y en Docker.

Build de produccion: `npm run build` (sale en `dist/jwt-angular-frontend/browser`).

## Notas

- El token se guarda en `localStorage` bajo la clave `marvel_jwt`. Es lo que pide
  el ejercicio; en un sistema real conviene moverlo a una cookie `HttpOnly` para
  reducir el impacto de un XSS.
- `console.log` del interceptor es intencional: es la evidencia que pide la
  practica de que cada request lleva el token.

## Pruebas

```bash
npm test     # 21 pruebas unitarias (vitest + TestBed)
npm run e2e  # 20 verificaciones en un Firefox real (Playwright)
```

`npm test` cubre el interceptor (adjunta `Authorization: Bearer`, no lo añade en
el login, limpia la sesión en un 401 y **no** en un 500), la reactividad del
signal del token, el login (guarda token y claims, un token expirado no cuenta
como sesión) y las rutas y métodos HTTP de los servicios.

`npm run e2e` necesita el stack levantado (`./setup.sh && docker compose up -d`
en la raíz del proyecto). Abre `http://localhost:8080`, hace login con LDAP,
recorre el dashboard, agrega/favorita/borra un item y cierra sesión; además
comprueba que los `<mat-icon>` renderizan glifos, que las 13 portadas cargan
desde `/posters/*.svg` y que no hay peticiones a recursos externos. Las
capturas quedan en `e2e/screenshots/`.

```bash
npm run e2e -- http://localhost:8080   # contra otro host
HEADED=1 npm run e2e                   # con la ventana del navegador visible
```
