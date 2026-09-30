import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · Marvel JWT',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'dashboard',
    title: 'Mi lista Marvel · Marvel JWT',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'agregar',
    title: 'Agregar item · Marvel JWT',
    canActivate: [authGuard],
    loadComponent: () => import('./features/add-item/add-item').then((m) => m.AddItem),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
