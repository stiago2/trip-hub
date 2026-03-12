import { Routes } from '@angular/router';
import { authGuard } from '@org/feature-auth';
import { AppLayoutComponent } from '@org/ui-layout';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('@org/feature-auth').then((m) => m.routes),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('@org/feature-auth').then((m) => m.AuthCallbackComponent),
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'trips',
        loadChildren: () =>
          import('@org/feature-trips').then((m) => m.routes),
      },
      {
        path: 'trips/:tripId',
        loadChildren: () =>
          import('@org/feature-trip-details').then((m) => m.routes),
      },
      {
        path: '',
        redirectTo: 'trips',
        pathMatch: 'full',
      },
    ],
  },
];
