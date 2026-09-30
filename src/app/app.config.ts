import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { JwtModule } from '@auth0/angular-jwt';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),

    // Los <mat-icon> usan la fuente local "Material Icons Round" (ver styles.scss).
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-icons-round' } },

    // HttpClient con el interceptor FUNCIONAL que adjunta el JWT.
    provideHttpClient(withInterceptors([authInterceptor])),

    // @auth0/angular-jwt: le enseñamos dónde vive el token para que
    // JwtHelperService pueda leerlo y decodificar los claims.
    importProvidersFrom(
      JwtModule.forRoot({
        config: {
          tokenGetter: () => localStorage.getItem('marvel_jwt'),
          headerName: 'Authorization',
          authScheme: 'Bearer',
        },
      }),
    ),
  ],
};
