import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { API, AuthService } from './auth.service';
import { ItemsService } from './items.service';
import { TokenStorage } from './token-storage';
import { makeToken } from './testing/jwt-fixtures';
import { provideTestJwt } from './testing/jwt-test-providers';

describe('ItemsService', () => {
  let service: ItemsService;
  let httpMock: HttpTestingController;

  const item = {
    id: 7,
    username: 'caleb',
    name: 'Avengers: Doomsday',
    category: 'Películas',
    image_url: '/posters/doomsday.svg',
    note: null,
    favorite: false,
    created_at: '2026-01-01T00:00:00+00:00',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestJwt(),
      ],
    });
    service = TestBed.inject(ItemsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('lista contra /api/items', () => {
    service.list().subscribe();
    const request = httpMock.expectOne(API.items);
    expect(request.request.method).toBe('GET');
    request.flush({ username: 'caleb', count: 1, items: [item] });
  });

  it('crea contra /api/items con POST', () => {
    service
      .create({ name: 'Thanos', category: 'Personajes', image_url: null, note: 'favorito' })
      .subscribe();

    const request = httpMock.expectOne(API.items);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Thanos',
      category: 'Personajes',
      image_url: null,
      note: 'favorito',
    });
    request.flush(item);
  });

  it('marca favorito con PATCH sólo del campo favorite', () => {
    service.setFavorite(item, true).subscribe();

    const request = httpMock.expectOne(`${API.items}/7`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ favorite: true });
    request.flush({ ...item, favorite: true });
  });

  it('borra con DELETE en /api/items/{id}', () => {
    service.remove(7).subscribe();

    const request = httpMock.expectOne(`${API.items}/7`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    httpMock.verify();
  });

  it('el servicio no manda el username: lo decide el token', () => {
    service.create({ name: 'Doom', category: 'Personajes', image_url: null, note: null }).subscribe();

    const request = httpMock.expectOne(API.items);
    expect(request.request.body).not.toHaveProperty('username');
    request.flush(item);
  });
});
