import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle,
  IonContent, IonList, IonItem, IonIcon, IonLabel,
  IonMenuToggle, IonRouterOutlet, IonButton, IonAvatar,
  MenuController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, cashOutline, bagHandleOutline, mapOutline,
  airplaneOutline, bedOutline, peopleOutline, listOutline,
  chevronBackOutline, arrowBackOutline, logOutOutline,
  locationOutline,
} from 'ionicons/icons';
import { AuthService, AuthStore } from '@org/feature-auth';
import { TripStore } from '@org/data-access-trips';
import { UpperCasePipe } from '@angular/common';

const TRIP_NAV = [
  { label: 'Overview',       icon: 'home-outline',         path: 'overview'       },
  { label: 'Destinations',   icon: 'map-outline',          path: 'destinations'   },
  { label: 'Budget',         icon: 'cash-outline',         path: 'budget'         },
  { label: 'Packing List',   icon: 'bag-handle-outline',   path: 'inventory'      },
  { label: 'Transport',      icon: 'airplane-outline',     path: 'transport'      },
  { label: 'Accommodations', icon: 'bed-outline',          path: 'accommodations' },
  { label: 'Members',        icon: 'people-outline',       path: 'members'        },
  { label: 'Activity',       icon: 'list-outline',         path: 'activity'       },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle,
    IonContent, IonList, IonItem, IonIcon, IonLabel,
    IonMenuToggle, IonRouterOutlet, IonButton, IonAvatar,
    RouterLink, RouterLinkActive, UpperCasePipe,
  ],
  template: `
    <ion-split-pane contentId="main-content" when="lg">

      <!-- ── Drawer ─────────────────────────────────── -->
      <ion-menu contentId="main-content" menuId="main-menu" side="start">
        <ion-header class="ion-no-border">
          <ion-toolbar>
            <div class="menu-brand">
              <div class="brand-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
              </div>
              <span class="brand-name">TripHub</span>
            </div>
          </ion-toolbar>
        </ion-header>

        <ion-content>

          <!-- Trip active: trip nav -->
          @if (activeTripId()) {
            <div class="menu-section">
              <button class="back-btn" (click)="backToTrips()">
                <ion-icon name="chevron-back-outline"></ion-icon>
                All Trips
              </button>
              <div class="trip-name">{{ tripName() }}</div>
            </div>

            <ion-list lines="none" class="nav-list">
              @for (item of tripNav; track item.path) {
                <ion-menu-toggle auto-hide="false">
                  <ion-item
                    [routerLink]="['/trip', activeTripId(), item.path]"
                    routerLinkActive="nav-active"
                    class="nav-item"
                    detail="false"
                  >
                    <ion-icon slot="start" [name]="item.icon"></ion-icon>
                    <ion-label>{{ item.label }}</ion-label>
                  </ion-item>
                </ion-menu-toggle>
              }
            </ion-list>
          }

          <!-- No active trip: global nav -->
          @if (!activeTripId()) {
            <ion-list lines="none" class="nav-list">
              <ion-menu-toggle auto-hide="false">
                <ion-item
                  routerLink="/trips"
                  routerLinkActive="nav-active"
                  class="nav-item"
                  detail="false"
                >
                  <ion-icon slot="start" name="location-outline"></ion-icon>
                  <ion-label>My Trips</ion-label>
                </ion-item>
              </ion-menu-toggle>
            </ion-list>
          }

        </ion-content>

        <!-- User footer -->
        <div class="menu-footer">
          @if (user()) {
            <div class="user-row">
              <ion-avatar class="user-avatar">
                @if (user()!.avatarUrl) {
                  <img [src]="user()!.avatarUrl!" alt="avatar" />
                } @else {
                  <div class="avatar-initials">{{ (user()!.name ?? user()!.email)[0] | uppercase }}</div>
                }
              </ion-avatar>
              <div class="user-info">
                <div class="user-name">{{ user()!.name ?? 'User' }}</div>
                <div class="user-email">{{ user()!.email }}</div>
              </div>
            </div>
          }
          <button class="logout-btn" (click)="logout()">
            <ion-icon name="log-out-outline"></ion-icon>
            Sign out
          </button>
        </div>
      </ion-menu>

      <!-- ── Main content ────────────────────────────── -->
      <ion-router-outlet id="main-content"></ion-router-outlet>

    </ion-split-pane>
  `,
  styles: [`
    ion-toolbar { --background: #ffffff; --border-color: transparent; }

    .menu-brand {
      display: flex; align-items: center; gap: 10px;
      padding: 16px 16px 12px; font-weight: 700; font-size: 1.05rem; color: #0f172a;
    }
    .brand-icon {
      width: 32px; height: 32px; border-radius: 8px; background: #2563eb;
      display: flex; align-items: center; justify-content: center;
    }

    .menu-section { padding: 12px 16px 8px; }
    .back-btn {
      display: flex; align-items: center; gap: 4px;
      background: none; border: none; color: #2563eb;
      font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 0;
      margin-bottom: 12px;
    }
    .trip-name {
      font-size: 0.78rem; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.06em;
      padding: 0 4px;
    }

    .nav-list { padding: 4px 8px; background: transparent; }
    .nav-item {
      --border-radius: 10px; --padding-start: 12px; --inner-padding-end: 12px;
      --background: transparent; --background-activated: #eff6ff;
      --color: #374151; margin-bottom: 2px; border-radius: 10px;
      font-size: 0.92rem; font-weight: 500;
    }
    .nav-item ion-icon { color: #64748b; font-size: 1.1rem; }
    .nav-item.nav-active {
      --background: #eff6ff; --color: #2563eb; font-weight: 600;
    }
    .nav-item.nav-active ion-icon { color: #2563eb; }

    .menu-footer {
      padding: 12px 16px 32px; border-top: 1px solid #f1f5f9;
      background: #ffffff;
    }
    .user-row {
      display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
    }
    .user-avatar {
      width: 36px; height: 36px; flex-shrink: 0;
    }
    .avatar-initials {
      width: 100%; height: 100%; background: #dbeafe; color: #2563eb;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; font-weight: 700; border-radius: 50%;
    }
    .user-name { font-size: 0.85rem; font-weight: 600; color: #0f172a; }
    .user-email { font-size: 0.75rem; color: #94a3b8; }
    .logout-btn {
      display: flex; align-items: center; gap: 6px;
      background: none; border: none; color: #64748b;
      font-size: 0.85rem; cursor: pointer; padding: 6px 0; width: 100%;
    }
    .logout-btn:hover { color: #ef4444; }
    .logout-btn ion-icon { font-size: 1rem; }
  `],
})
export class ShellPage {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly tripStore = inject(TripStore);
  private readonly router = inject(Router);
  private readonly menuCtrl = inject(MenuController);

  readonly tripNav = TRIP_NAV;
  readonly user = computed(() => this.authStore.user());
  readonly activeTripId = computed(() => this.tripStore.activeTripId());
  readonly tripName = computed(() => this.tripStore.trip()?.title ?? '');

  constructor() {
    addIcons({
      homeOutline, cashOutline, bagHandleOutline, mapOutline,
      airplaneOutline, bedOutline, peopleOutline, listOutline,
      chevronBackOutline, arrowBackOutline, logOutOutline,
      locationOutline,
    });
  }

  backToTrips(): void {
    this.tripStore.clearActiveTrip();
    this.menuCtrl.close();
    this.router.navigate(['/trips']);
  }

  logout(): void {
    this.authService.logout();
    this.authStore.clearUser();
    this.router.navigate(['/login']);
  }
}
