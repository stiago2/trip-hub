import { Component, computed, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonMenuButton, IonIcon, IonSkeletonText, ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mapOutline, cashOutline, bagHandleOutline, airplaneOutline,
  bedOutline, peopleOutline, listOutline, searchOutline, documentOutline,
} from 'ionicons/icons';
import { TripStore } from '@org/data-access-trips';
import { FlightSearchModalComponent } from './flight-search-modal.component';
import { ImportDocumentModalComponent } from './import-document-modal.component';

const SECTIONS = [
  { label: 'Destinations',   icon: 'map-outline',        path: 'destinations',   action: 'navigate' },
  { label: 'Budget',         icon: 'cash-outline',       path: 'budget',         action: 'navigate' },
  { label: 'Packing List',   icon: 'bag-handle-outline', path: 'inventory',      action: 'navigate' },
  { label: 'Transport',      icon: 'airplane-outline',   path: 'transport',      action: 'navigate' },
  { label: 'Accommodations', icon: 'bed-outline',        path: 'accommodations', action: 'navigate' },
  { label: 'Members',        icon: 'people-outline',     path: 'members',        action: 'navigate' },
  { label: 'Activity',       icon: 'list-outline',       path: 'activity',       action: 'navigate' },
  { label: 'Search Flights', icon: 'search-outline',     path: 'flights',        action: 'flights'  },
  { label: 'Import Doc',     icon: 'document-outline',   path: 'import',         action: 'import'   },
];

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    DatePipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonMenuButton, IonIcon, IonSkeletonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ trip()?.title ?? 'Overview' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (store.loading()) {
        <div class="overview-wrap">
          @for (i of [1,2,3,4]; track i) {
            <ion-skeleton-text animated style="height:80px;border-radius:16px;display:block"></ion-skeleton-text>
          }
        </div>
      }

      @if (!store.loading() && trip()) {
        <div class="overview-wrap">
          <!-- Trip hero card -->
          <div class="hero-card">
            <div class="hero-dates">
              {{ trip()!.startDate | date:'MMM d' }} – {{ trip()!.endDate | date:'MMM d, y' }}
            </div>
            <h2 class="hero-title">{{ trip()!.title }}</h2>
            @if (trip()!.description) {
              <p class="hero-desc">{{ trip()!.description }}</p>
            }
          </div>

          <!-- Quick nav grid -->
          <div class="sections-grid">
            @for (s of sections; track s.path) {
              <div
                class="section-card"
                [class.section-card--action]="s.action !== 'navigate'"
                (click)="handleSection(s)"
              >
                <div class="section-icon" [class.section-icon--purple]="s.action === 'flights'" [class.section-icon--teal]="s.action === 'import'">
                  <ion-icon [name]="s.icon"></ion-icon>
                </div>
                <div class="section-label">{{ s.label }}</div>
              </div>
            }
          </div>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .overview-wrap { padding: 16px; display: flex; flex-direction: column; gap: 16px; }

    .hero-card {
      border-radius: 20px; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      padding: 24px; color: white;
    }
    .hero-dates { font-size: 0.8rem; opacity: 0.75; margin-bottom: 6px; }
    .hero-title { font-size: 1.5rem; font-weight: 800; margin: 0 0 8px; }
    .hero-desc { font-size: 0.9rem; opacity: 0.8; margin: 0; line-height: 1.5; }

    .sections-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    }
    .section-card {
      border-radius: 16px; background: #ffffff;
      box-shadow: 0 2px 10px rgba(15,23,42,0.07);
      padding: 20px 16px; display: flex; flex-direction: column;
      align-items: flex-start; gap: 10px; cursor: pointer;
      transition: transform 0.15s;
    }
    .section-card:active { transform: scale(0.96); }
    .section-card--action { background: #fafbff; border: 1.5px solid #e0e7ff; }

    .section-icon {
      width: 40px; height: 40px; border-radius: 12px; background: #eff6ff;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; color: #2563eb;
    }
    .section-icon--purple { background: #f5f3ff; color: #7c3aed; }
    .section-icon--teal   { background: #f0fdfa; color: #0d9488; }

    .section-label { font-size: 0.88rem; font-weight: 600; color: #0f172a; }
  `],
})
export class OverviewPage implements OnInit {
  readonly store = inject(TripStore);
  readonly trip = computed(() => this.store.trip());
  readonly sections = SECTIONS;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly modalCtrl = inject(ModalController);

  constructor() {
    addIcons({ mapOutline, cashOutline, bagHandleOutline, airplaneOutline, bedOutline, peopleOutline, listOutline, searchOutline, documentOutline });
  }

  ngOnInit(): void {
    const tripId = this.route.snapshot.parent?.paramMap.get('tripId');
    if (tripId && this.store.activeTripId() !== tripId) {
      this.store.setActiveTrip(tripId);
    }
  }

  async handleSection(section: typeof SECTIONS[0]): Promise<void> {
    if (section.action === 'navigate') {
      const id = this.store.activeTripId();
      if (id) this.router.navigate(['/trip', id, section.path]);
    } else if (section.action === 'flights') {
      const modal = await this.modalCtrl.create({ component: FlightSearchModalComponent });
      await modal.present();
    } else if (section.action === 'import') {
      const modal = await this.modalCtrl.create({ component: ImportDocumentModalComponent });
      await modal.present();
    }
  }
}
