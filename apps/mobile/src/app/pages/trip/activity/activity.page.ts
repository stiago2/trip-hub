import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonIcon, IonSkeletonText, IonInfiniteScroll, IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { listOutline, timeOutline } from 'ionicons/icons';
import { TripStore, ActivityApiService } from '@org/data-access-trips';
import { ActivityItem } from '@org/util-types';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [
    DatePipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonIcon, IonSkeletonText, IonInfiniteScroll, IonInfiniteScrollContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>Activity</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (loading()) {
        <div class="list-wrap">
          @for (i of [1,2,3,4]; track i) {
            <ion-skeleton-text animated style="height:64px;border-radius:14px;margin-bottom:8px"></ion-skeleton-text>
          }
        </div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><ion-icon name="list-outline"></ion-icon></div>
          <h3>No activity yet</h3>
          <p>Actions on this trip will appear here</p>
        </div>
      } @else {
        <div class="list-wrap">
          @for (item of items(); track item.id) {
            <div class="activity-row">
              <div class="activity-dot"></div>
              <div class="activity-body">
                <div class="activity-msg">{{ item.message }}</div>
                <div class="activity-meta">
                  {{ item.userName }} · {{ item.createdAt | date:'MMM d, h:mm a' }}
                </div>
              </div>
            </div>
          }
        </div>

        <ion-infinite-scroll (ionInfinite)="loadMore($event)" [disabled]="allLoaded()">
          <ion-infinite-scroll-content></ion-infinite-scroll-content>
        </ion-infinite-scroll>
      }
    </ion-content>
  `,
  styles: [`
    .list-wrap { padding: 16px; }

    .activity-row {
      display: flex; gap: 12px; margin-bottom: 10px; align-items: flex-start;
    }
    .activity-dot {
      width: 10px; height: 10px; border-radius: 50%; background: #2563eb;
      margin-top: 5px; flex-shrink: 0;
    }
    .activity-body {
      background: #fff; border-radius: 12px; padding: 10px 14px; flex: 1;
      box-shadow: 0 1px 6px rgba(15,23,42,0.05);
    }
    .activity-msg { font-size: 0.88rem; font-weight: 500; color: #0f172a; line-height: 1.4; }
    .activity-meta { font-size: 0.72rem; color: #94a3b8; margin-top: 4px; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 80px 32px; gap: 12px; text-align: center;
    }
    .empty-icon {
      width: 72px; height: 72px; border-radius: 20px; background: #eff6ff;
      display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #2563eb;
    }
    .empty-state h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .empty-state p  { margin: 0; font-size: 0.9rem; color: #64748b; }
  `],
})
export class ActivityPage {
  private readonly tripStore = inject(TripStore);
  private readonly api = inject(ActivityApiService);

  readonly items = signal<ActivityItem[]>([]);
  readonly loading = signal(false);
  readonly allLoaded = signal(false);
  private offset = 0;
  private readonly LIMIT = 20;

  constructor() {
    addIcons({ listOutline, timeOutline });
    this.load();
  }

  private load(): void {
    const id = this.tripStore.activeTripId();
    if (!id) return;
    this.loading.set(true);
    this.api.getActivityByTrip(id, this.LIMIT, this.offset).subscribe({
      next: ({ items, total }) => {
        this.items.update((list) => [...list, ...items]);
        this.offset += items.length;
        this.allLoaded.set(this.offset >= total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadMore(event: CustomEvent): void {
    const id = this.tripStore.activeTripId();
    if (!id) { (event.target as HTMLIonInfiniteScrollElement).complete(); return; }
    this.api.getActivityByTrip(id, this.LIMIT, this.offset).subscribe({
      next: ({ items, total }) => {
        this.items.update((list) => [...list, ...items]);
        this.offset += items.length;
        this.allLoaded.set(this.offset >= total);
        (event.target as HTMLIonInfiniteScrollElement).complete();
      },
      error: () => (event.target as HTMLIonInfiniteScrollElement).complete(),
    });
  }
}
