import { Routes } from '@angular/router';
import { TripDetailsPage } from '../pages/trip-details.page';
import { TransportTabComponent } from '../tabs/transport-tab.component';
import { AccommodationsTabComponent } from '../tabs/accommodations-tab.component';
import { ActivityTabComponent } from '../tabs/activity-tab.component';

export const routes: Routes = [
  {
    path: '',
    component: TripDetailsPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadChildren: () =>
          import('@org/feature-trip-overview').then((m) => m.routes),
      },
      {
        path: 'inventory',
        loadChildren: () =>
          import('@org/feature-inventory').then((m) => m.routes),
      },
      {
        path: 'destinations',
        loadChildren: () =>
          import('@org/feature-destinations').then((m) => m.routes),
      },
      { path: 'transport', component: TransportTabComponent },
      { path: 'accommodations', component: AccommodationsTabComponent },
      {
        path: 'budget',
        loadChildren: () =>
          import('@org/feature-budget').then((m) => m.routes),
      },
      {
        path: 'members',
        loadChildren: () =>
          import('@org/feature-trip-members').then((m) => m.routes),
      },
      { path: 'activity', component: ActivityTabComponent },
    ],
  },
];
