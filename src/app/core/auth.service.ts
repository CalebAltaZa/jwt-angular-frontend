import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { JwtClaims, LoginRequest, LoginResponse } from './models';
import { TokenStorage } from './token-storage';

export const API = {
  login: '/api/auth/login',
  items: '/api/items',
};

/**
 * Sesión del frontend: login contra la API de LDAP, guardado del JWT y
 * lectura de sus claims con @auth0/angular-jwt (sin verificar la firma,
 * eso lo hace el backend con la clave pública).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorage);
  private readonly jwtHelper = inject(JwtHelperService);
  private readonly router = inject(Router);

  private readonly claims = signal<JwtClaims | null>(this.readClaims());

  /** Claims del JWT actual (null si no hay sesión). */
  readonly user = this.claims.asReadonly();

  readonly isAuthenticated = computed(() => {
    const token = this.storage.token();
    if (!token) return false;
    if (this.jwtHelper.isTokenExpired(token)) {
      return false;
    }
    return true;
  });

  readonly username = computed(() => this.claims()?.sub ?? '');
  readonly dn = computed(() => this.claims()?.dn ?? '');

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(API.login, credentials).pipe(
      tap((response) => {
        this.storage.set(response.access_token);
        this.claims.set(this.readClaims());
        console.log(
          `[JWT] login OK — ${response.username} (expira en ${response.expires_in}s)`,
          this.claims(),
        );
      }),
    );
  }

  logout(): void {
    this.storage.clear();
    this.claims.set(null);
    void this.router.navigate(['/login']);
  }

  private readClaims(): JwtClaims | null {
    const token = this.storage.get();
    if (!token) return null;
    if (this.jwtHelper.isTokenExpired(token)) {
      this.storage.clear();
      return null;
    }
    return this.jwtHelper.decodeToken<JwtClaims>(token);
  }
}
