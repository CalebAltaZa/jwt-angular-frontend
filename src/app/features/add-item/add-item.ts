import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { ItemsService } from '../../core/items.service';
import { CATEGORIES } from '../../core/models';

@Component({
  selector: 'app-add-item',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    RouterLink,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './add-item.html',
})
export class AddItem {
  private readonly fb = inject(FormBuilder);
  private readonly itemsService = inject(ItemsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly categories = CATEGORIES;
  protected readonly saving = signal(false);
  protected readonly previewFailed = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    category: ['Películas', Validators.required],
    image_url: ['', [Validators.maxLength(500)]],
    note: ['', [Validators.maxLength(500)]],
  });

  /** Vista previa de la imagen mientras se escribe la URL. */
  protected readonly preview = toSignal(
    this.form.controls.image_url.valueChanges.pipe(map((value) => value.trim())),
    { initialValue: '' },
  );

  constructor() {
    // Si el usuario pega otra URL, se vuelve a intentar la vista previa.
    this.form.controls.image_url.valueChanges.subscribe(() => this.previewFailed.set(false));
  }

  /** El backend guarda el item con el claim `sub`, no con lo que mande el form. */
  protected readonly expiresAt = computed(() => {
    const exp = this.auth.user()?.exp;
    return exp ? new Date(exp * 1000) : null;
  });

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    this.itemsService
      .create({
        name: value.name.trim(),
        category: value.category,
        image_url: value.image_url.trim() || null,
        note: value.note.trim() || null,
      })
      .subscribe({
        next: (created) => {
          this.snackBar.open(`"${created.name}" agregado a tu lista`, 'Cerrar', { duration: 2500 });
          void this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.saving.set(false);
          this.error.set('No se pudo guardar el item. Revisa la consola del navegador.');
        },
      });
  }
}
