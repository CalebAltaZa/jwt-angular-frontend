import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService, API } from './auth.service';
import { TokenStorage } from './token-storage';
import { makeToken } from './testing/jwt-fixtures';
import { provideTestJwt } from './testing/jwt-test-providers';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let storage: TokenStorage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTestJwt(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(TokenStorage);
  });

  it('expone la ruta de login', () => {
    expect(API.login).toBe('/api/auth/login');
  });

  it('tras un login exitoso guarda el token y lee los claims', () => {
    const token = makeToken();
    let respuesta: unknown;
    service.login({ username: 'caleb', password: 'caleb123' }).subscribe((r) => (respuesta = r));

    httpMock.expectOne(API.login).flush({
      access_token: token,
      token_type: 'bearer',
      expires_in: 1800,
      username: 'caleb',
      dn: 'uid=caleb,ou=users,dc=example,dc=com',
    });

    expect(respuesta).toBeTruthy();
    expect(storage.get()).toBe(token);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.username()).toBe('caleb');
    expect(service.dn()).toBe('uid=caleb,ou=users,dc=example,dc=com');
    httpMock.verify();
  });

  it('envía usuario y contraseña en el body', () => {
    service.login({ username: 'ivan', password: 'ivan123' }).subscribe();

    const request = httpMock.expectOne(API.login);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ username: 'ivan', password: 'ivan123' });
    request.flush({ access_token: makeToken(), token_type: 'bearer', expires_in: 1, username: 'ivan', dn: 'dn' });
  });

  it('no guarda nada si el backend responde 401', () => {
    service.login({ username: 'caleb', password: 'mala' }).subscribe({ error: () => undefined });

    httpMock
      .expectOne(API.login)
      .flush({ detail: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(storage.get()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('un token expirado no cuenta como sesión iniciada', () => {
    storage.set(makeToken({}, /* expired */ true));

    expect(service.isAuthenticated()).toBe(false);
  });

  it('logout limpia el token y los claims', () => {
    storage.set(makeToken());
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    service.logout();

    expect(storage.get()).toBeNull();
    expect(localStorage.getItem('marvel_jwt')).toBeNull();
    expect(service.user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
