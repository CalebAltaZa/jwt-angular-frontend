import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

import { TokenStorage } from './token-storage';

/** Ruta protegida: sin JWT vigente no se entra al dashboard. */
export const authGuard: CanActivateFn = () => {
  const storage = inject(TokenStorage);
  const jwtHelper = inject(JwtHelperService);
  const router = inject(Router);

  const token = storage.token();
  if (token && !jwtHelper.isTokenExpired(token)) {
    return true;
  }

  storage.clear();
  return router.createUrlTree(['/login']);
};
