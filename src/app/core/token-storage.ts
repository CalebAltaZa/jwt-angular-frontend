import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'marvel_jwt';

/**
 * Única fuente de verdad del token.
 *
 * El token vive en un signal, no sólo en localStorage: así el interceptor
 * puede limpiarlo ante un 401 y las vistas (guard, navbar) reaccionan solas
 * sin coupling con AuthService.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private readonly current = signal<string | null>(localStorage.getItem(STORAGE_KEY));

  readonly token = this.current.asReadonly();

  get(): string | null {
    return this.current();
  }

  set(token: string): void {
    localStorage.setItem(STORAGE_KEY, token);
    this.current.set(token);
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.current.set(null);
  }
}
