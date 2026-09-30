import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API } from './auth.service';
import { Item, ItemCreate, ItemsResponse } from './models';

/**
 * Todas estas rutas viajan con `Authorization: Bearer <jwt>` porque lo
 * inyecta el interceptor funcional; el backend NO confía en el username
 * que mande el body, usa el claim `sub` del token.
 */
@Injectable({ providedIn: 'root' })
export class ItemsService {
  private readonly http = inject(HttpClient);

  list(): Observable<ItemsResponse> {
    return this.http.get<ItemsResponse>(API.items);
  }

  create(item: ItemCreate): Observable<Item> {
    return this.http.post<Item>(API.items, item);
  }

  setFavorite(item: Item, favorite: boolean): Observable<Item> {
    return this.http.patch<Item>(`${API.items}/${item.id}`, { favorite });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${API.items}/${id}`);
  }
}
