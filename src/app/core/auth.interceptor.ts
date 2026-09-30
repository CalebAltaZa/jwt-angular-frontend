import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { TokenStorage } from './token-storage';

/**
 * Interceptor FUNCIONAL (HttpInterceptorFn) — la forma moderna en Angular.
 *
 * 1. Lee el JWT emitido por jwt-ldap-auth (vía @auth0/angular-jwt config).
 * 2. Lo inyecta en TODAS las peticiones salientes.
 * 3. Lo deja visible en la consola: es justo lo que hay que mostrar en el
 *    video (pestaña Network / DevTools Console).
 * 4. Si el backend responde 401, limpia la sesión y vuelve al login.
 *
 * Nota: no se inyecta AuthService aquí a propósito — AuthService usa
 * HttpClient y eso crearía una dependencia cíclica.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(TokenStorage);
  const router = inject(Router);
  const token = storage.get();

  const isApiCall = req.url.includes('/api/');
  const authorized = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  if (isApiCall) {
    if (token) {
      const preview = `${token.slice(0, 24)}…${token.slice(-8)}`;
      console.log(
        `[JWT] ${authorized.method} ${authorized.url}  Authorization: Bearer ${preview}`,
      );
    } else {
      console.log(`[JWT] ${req.method} ${req.url}  (sin token todavía)`);
    }
  }

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && token) {
        console.warn('[JWT] 401 -> el token fue rechazado o expiró, se cierra sesión');
        storage.clear();
        void router.navigate(['/login'], { queryParams: { expired: '1' } });
      }
      return throwError(() => error);
    }),
  );
};
