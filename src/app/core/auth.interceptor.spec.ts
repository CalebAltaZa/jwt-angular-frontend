import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authInterceptor } from './auth.interceptor';
import { TokenStorage } from './token-storage';
import { makeToken } from './testing/jwt-fixtures';
import { provideTestJwt } from './testing/jwt-test-providers';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let storage: TokenStorage;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTestJwt(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(TokenStorage);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('adjunta Authorization: Bearer <jwt> cuando hay sesión', () => {
    const token = makeToken();
    storage.set(token);

    http.get('/api/items').subscribe();

    const request = httpMock.expectOne('/api/items');
    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    request.flush({ items: [] });
    httpMock.verify();
  });

  it('no adjunta el header si no hay token', () => {
    http.post('/api/auth/login', {}).subscribe();

    const request = httpMock.expectOne('/api/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
    httpMock.verify();
  });

  it('propaga el error si la API responde 401', () => {
    storage.set(makeToken());
    let status = 0;
    http.get('/api/items').subscribe({ error: (err: HttpErrorResponse) => (status = err.status) });

    httpMock
      .expectOne('/api/items')
      .flush('nope', { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    httpMock.verify();
  });

  it('limpia la sesión y vuelve al login cuando el token es rechazado', () => {
    storage.set(makeToken());

    http.get('/api/items').subscribe({ error: () => undefined });
    httpMock
      .expectOne('/api/items')
      .flush('expirado', { status: 401, statusText: 'Unauthorized' });

    expect(storage.token()).toBeNull();
    expect(localStorage.getItem('marvel_jwt')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { expired: '1' } });
  });

  it('deja intacta la sesión si el fallo no es 401', () => {
    const token = makeToken();
    storage.set(token);

    http.get('/api/items').subscribe({ error: () => undefined });
    httpMock
      .expectOne('/api/items')
      .flush('boom', { status: 500, statusText: 'Server Error' });

    expect(storage.token()).toBe(token);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
