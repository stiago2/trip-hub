import { Routes } from '@angular/router';
import { authGuard } from '@org/feature-auth';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback.page').then((m) => m.AuthCallbackPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/shell/shell.page').then((m) => m.ShellPage),
    children: [
      {
        path: 'trips',
        loadComponent: () =>
          import('./pages/trips/trips.page').then((m) => m.TripsPage),
      },
      {
        path: 'trip/:tripId',
        children: [
          {
            path: 'overview',
            loadComponent: () =>
              import('./pages/trip/overview/overview.page').then((m) => m.OverviewPage),
          },
          {
            path: 'budget',
            loadComponent: () =>
              import('./pages/trip/budget/budget.page').then((m) => m.BudgetPage),
          },
          {
            path: 'inventory',
            loadComponent: () =>
              import('./pages/trip/inventory/inventory.page').then((m) => m.InventoryPage),
          },
          {
            path: 'destinations',
            loadComponent: () =>
              import('./pages/trip/destinations/destinations.page').then((m) => m.DestinationsPage),
          },
          {
            path: 'transport',
            loadComponent: () =>
              import('./pages/trip/transport/transport.page').then((m) => m.TransportPage),
          },
          {
            path: 'accommodations',
            loadComponent: () =>
              import('./pages/trip/accommodations/accommodations.page').then((m) => m.AccommodationsPage),
          },
          {
            path: 'members',
            loadComponent: () =>
              import('./pages/trip/members/members.page').then((m) => m.MembersPage),
          },
          {
            path: 'activity',
            loadComponent: () =>
              import('./pages/trip/activity/activity.page').then((m) => m.ActivityPage),
          },
          { path: '', redirectTo: 'overview', pathMatch: 'full' },
        ],
      },
      { path: '', redirectTo: 'trips', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'trips' },
];
