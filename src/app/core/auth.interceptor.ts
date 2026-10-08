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
 * 3. Si el backend responde 401, limpia la sesión y vuelve al login.
 *
 * Por seguridad el token NUNCA se imprime en consola: la evidencia del JWT
 * se ve en la pestaña Network del DevTools (cabecera Authorization).
 *
 * Nota: no se inyecta AuthService aquí a propósito — AuthService usa
 * HttpClient y eso crearía una dependencia cíclica.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(TokenStorage);
  const router = inject(Router);
  const token = storage.get();

  const authorized = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

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
