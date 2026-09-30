import { effect } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { TokenStorage } from './token-storage';
import { makeToken } from './testing/jwt-fixtures';
import { provideTestJwt } from './testing/jwt-test-providers';

describe('TokenStorage', () => {
  let storage: TokenStorage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideTestJwt(),
      ],
    });
    storage = TestBed.inject(TokenStorage);
  });

  it('empieza sin token', () => {
    expect(storage.token()).toBeNull();
    expect(storage.get()).toBeNull();
  });

  it('guarda el token en localStorage y en el signal', () => {
    const token = makeToken();
    storage.set(token);

    expect(storage.token()).toBe(token);
    expect(localStorage.getItem('marvel_jwt')).toBe(token);
  });

  it('limpia el signal y el almacenamiento', () => {
    storage.set(makeToken());
    storage.clear();

    expect(storage.token()).toBeNull();
    expect(localStorage.getItem('marvel_jwt')).toBeNull();
  });

  it('el signal notifica a quien lo lee (reactividad de la UI)', () => {
    const vistos: (string | null)[] = [];
    const token = makeToken();

    TestBed.runInInjectionContext(() => {
      effect(() => vistos.push(storage.token()));
    });

    TestBed.flushEffects(); // primera lectura: todavía no hay sesión
    storage.set(token);
    TestBed.flushEffects();
    storage.clear();
    TestBed.flushEffects();

    // El effect corre una vez al crearse (null) y de nuevo en cada cambio.
    expect(vistos).toEqual([null, token, null]);
  });

  it('recupera el token que ya estaba en localStorage (sesión restaurada)', () => {
    const token = makeToken();
    localStorage.setItem('marvel_jwt', token);

    // Se crea una instancia nueva, como si recargaras la página.
    const otra = new TokenStorage();
    expect(otra.get()).toBe(token);
  });
});
