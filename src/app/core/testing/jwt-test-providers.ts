import { importProvidersFrom } from '@angular/core';
import { JwtModule } from '@auth0/angular-jwt';

/**
 * Mismo cableado de @auth0/angular-jwt que app.config.ts, para que las pruebas
 * usen el JwtHelperService real (decodifica claims, detecta expiración).
 */
export function provideTestJwt() {
  return importProvidersFrom(
    JwtModule.forRoot({
      config: {
        tokenGetter: () => localStorage.getItem('marvel_jwt'),
        headerName: 'Authorization',
        authScheme: 'Bearer',
      },
    }),
  );
}
