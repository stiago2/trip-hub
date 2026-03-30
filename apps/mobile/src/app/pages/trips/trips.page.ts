import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher,
  IonRefresherContent, IonFab, IonFabButton, IonIcon,
  IonMenuButton, IonButtons, IonSkeletonText, IonBadge,
  IonSegment, IonSegmentButton, IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, airplaneOutline } from 'ionicons/icons';
import { TripsStore } from '@org/feature-trips';
import { TripStore } from '@org/data-access-trips';
import { Trip } from '@org/util-types';

type Filter = 'all' | 'upcoming' | 'active' | 'past';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [
    DatePipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher,
    IonRefresherContent, IonFab, IonFabButton, IonIcon,
    IonMenuButton, IonButtons, IonSkeletonText, IonBadge,
    IonSegment, IonSegmentButton, IonLabel,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>My Trips</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Filter tabs -->
      <div class="filter-wrap">
        <ion-segment [value]="filter()" (ionChange)="filter.set($any($event.detail.value))">
          <ion-segment-button value="all"><ion-label>All</ion-label></ion-segment-button>
          <ion-segment-button value="upcoming"><ion-label>Upcoming</ion-label></ion-segment-button>
          <ion-segment-button value="active"><ion-label>Active</ion-label></ion-segment-button>
          <ion-segment-button value="past"><ion-label>Past</ion-label></ion-segment-button>
        </ion-segment>
      </div>

      <!-- Loading skeletons -->
      @if (store.loading()) {
        <div class="trips-list">
          @for (i of [1,2,3]; track i) {
            <div class="trip-card skeleton-card">
              <ion-skeleton-text animated style="height:100%;border-radius:16px"></ion-skeleton-text>
            </div>
          }
        </div>
      }

      <!-- Trips list -->
      @if (!store.loading()) {
        @if (filtered().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <ion-icon name="airplane-outline"></ion-icon>
            </div>
            <h3>No trips yet</h3>
            <p>Tap + to plan your first adventure</p>
          </div>
        } @else {
          <div class="trips-list">
            @for (trip of filtered(); track trip.id) {
              <div class="trip-card" (click)="openTrip(trip)">
                <div class="card-accent" [style.background]="getColor(trip)"></div>
                <div class="card-body">
                  <div class="card-top">
                    <div class="card-title">{{ trip.title }}</div>
                    <span class="status-badge" [class]="'status-' + getStatus(trip)">
                      {{ getStatus(trip) }}
                    </span>
                  </div>
                  @if (trip.description) {
                    <div class="card-desc">{{ trip.description }}</div>
                  }
                  <div class="card-meta">
                    <span>{{ trip.startDate | date:'MMM d' }} – {{ trip.endDate | date:'MMM d, y' }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }
    </ion-content>

    <!-- FAB: new trip -->
    <ion-fab slot="fixed" vertical="bottom" horizontal="end">
      <ion-fab-button color="primary" (click)="newTrip()">
        <ion-icon name="add-outline"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  `,
  styles: [`
    .filter-wrap { padding: 12px 16px 0; }

    .trips-list { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

    .trip-card {
      display: flex; border-radius: 16px; background: #ffffff;
      box-shadow: 0 2px 12px rgba(15,23,42,0.07); overflow: hidden;
      min-height: 90px; cursor: pointer; transition: transform 0.15s;
    }
    .trip-card:active { transform: scale(0.98); }

    .skeleton-card { height: 90px; }

    .card-accent { width: 6px; flex-shrink: 0; }
    .card-body { flex: 1; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }

    .card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .card-title { font-size: 1rem; font-weight: 700; color: #0f172a; flex: 1; }
    .card-desc { font-size: 0.82rem; color: #64748b; line-height: 1.4; }
    .card-meta { font-size: 0.78rem; color: #94a3b8; }

    .status-badge {
      font-size: 0.7rem; font-weight: 600; padding: 3px 8px;
      border-radius: 20px; text-transform: capitalize; white-space: nowrap;
    }
    .status-upcoming { background: #dbeafe; color: #1d4ed8; }
    .status-active   { background: #d1fae5; color: #065f46; }
    .status-past     { background: #f1f5f9; color: #475569; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 80px 32px; text-align: center; gap: 12px;
    }
    .empty-icon {
      width: 72px; height: 72px; border-radius: 20px; background: #eff6ff;
      display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #2563eb;
    }
    .empty-state h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .empty-state p  { margin: 0; font-size: 0.9rem; color: #64748b; }
  `],
})
export class TripsPage {
  private readonly router = inject(Router);
  readonly store = inject(TripsStore);
  private readonly tripStore = inject(TripStore);

  readonly filter = signal<Filter>('all');

  readonly filtered = computed(() => {
    const trips = this.store.trips();
    const now = new Date();
    return trips.filter((t) => {
      if (this.filter() === 'all') return true;
      const start = new Date(t.startDate);
      const end = new Date(t.endDate);
      if (this.filter() === 'active')   return start <= now && end >= now;
      if (this.filter() === 'upcoming') return start > now;
      if (this.filter() === 'past')     return end < now;
      return true;
    });
  });

  constructor() {
    addIcons({ addOutline, airplaneOutline });
    this.store.loadTrips();
  }

  getStatus(trip: Trip): string {
    const now = new Date();
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (start <= now && end >= now) return 'active';
    if (start > now) return 'upcoming';
    return 'past';
  }

  getColor(trip: Trip): string {
    const colors = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2'];
    const idx = trip.id.charCodeAt(0) % colors.length;
    return colors[idx];
  }

  openTrip(trip: Trip): void {
    this.tripStore.setActiveTrip(trip.id);
    this.router.navigate(['/trip', trip.id, 'overview']);
  }

  newTrip(): void {
    // TODO: open create trip modal in Phase 2
  }

  refresh(event: CustomEvent): void {
    this.store.loadTrips();
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 800);
  }
}
