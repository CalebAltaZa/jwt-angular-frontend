import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { ItemsService } from '../../core/items.service';
import { CATEGORIES, Item } from '../../core/models';

/** Póster por defecto cuando un item no tiene imagen o la URL falla. */
const FALLBACK_POSTER = '/posters/fallback.svg';

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly itemsService = inject(ItemsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly categories = CATEGORIES;

  protected readonly items = signal<Item[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly category = signal<string>('Todas');

  /** Ids cuya imagen no cargó: se les muestra el póster por defecto. */
  private readonly brokenImages = signal<ReadonlySet<number>>(new Set());

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const category = this.category();

    return this.items().filter((item) => {
      const matchesCategory = category === 'Todas' || item.category === category;
      const matchesTerm =
        !term ||
        item.name.toLowerCase().includes(term) ||
        (item.note ?? '').toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
  });

  protected readonly favorites = computed(() => this.items().filter((i) => i.favorite).length);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.brokenImages.set(new Set());
    this.itemsService.list().subscribe({
      next: (response) => {
        this.items.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar tu lista. Revisa la consola y que el backend esté arriba.');
        this.loading.set(false);
      },
    });
  }

  /** URL de la imagen: si falló o no hay, se usa el póster local. */
  protected imageSrc(item: Item): string {
    if (this.brokenImages().has(item.id) || !item.image_url) {
      return FALLBACK_POSTER;
    }
    return item.image_url;
  }

  protected markImageBroken(item: Item): void {
    this.brokenImages.update((current) => new Set([...current, item.id]));
  }

  protected setCategory(category: string): void {
    this.category.set(category);
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected toggleFavorite(item: Item): void {
    this.itemsService.setFavorite(item, !item.favorite).subscribe({
      next: (updated) => {
        this.items.update((list) => list.map((i) => (i.id === updated.id ? updated : i)));
      },
      error: () => this.snackBar.open('No se pudo actualizar el favorito', 'Cerrar', { duration: 3000 }),
    });
  }

  protected remove(item: Item): void {
    if (!confirm(`¿Eliminar "${item.name}" de tu lista?`)) {
      return;
    }
    this.itemsService.remove(item.id).subscribe({
      next: () => {
        this.items.update((list) => list.filter((i) => i.id !== item.id));
        this.snackBar.open('Item eliminado', 'Cerrar', { duration: 2500 });
      },
      error: () => this.snackBar.open('No se pudo eliminar el item', 'Cerrar', { duration: 3000 }),
    });
  }

  protected logout(): void {
    this.auth.logout();
  }

  protected goToAdd(): void {
    void this.router.navigate(['/agregar']);
  }
}
