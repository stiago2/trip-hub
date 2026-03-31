import { Component, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonFab, IonFabButton, IonIcon, IonSpinner, IonSkeletonText,
  IonModal, IonButton, IonItem, IonLabel, IonInput,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, bedOutline, trashOutline, businessOutline } from 'ionicons/icons';
import { TripStore, AccommodationApiService, DestinationsApiService } from '@org/data-access-trips';
import { Accommodation, Destination } from '@org/util-types';

@Component({
  selector: 'app-accommodations',
  standalone: true,
  imports: [
    DatePipe, CurrencyPipe, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonFab, IonFabButton, IonIcon, IonSpinner, IonSkeletonText,
    IonModal, IonButton, IonItem, IonLabel, IonInput,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>Accommodations</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (loading()) {
        <div class="list-wrap">
          @for (i of [1,2,3]; track i) {
            <ion-skeleton-text animated style="height:80px;border-radius:14px;margin-bottom:10px"></ion-skeleton-text>
          }
        </div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><ion-icon name="bed-outline"></ion-icon></div>
          <h3>No accommodations yet</h3>
          <p>Tap + to add hotels and stays</p>
        </div>
      } @else {
        <div class="list-wrap">
          @for (item of items(); track item.id) {
            <div class="acc-card">
              <div class="acc-icon"><ion-icon name="business-outline"></ion-icon></div>
              <div class="acc-info">
                <div class="acc-name">{{ item.name }}</div>
                <div class="acc-dates">
                  {{ item.checkIn | date:'MMM d' }} – {{ item.checkOut | date:'MMM d, y' }}
                </div>
                @if (item.address) {
                  <div class="acc-address">{{ item.address }}</div>
                }
                @if (item.price) {
                  <div class="acc-price">{{ item.price | currency }}</div>
                }
              </div>
              <button class="delete-btn" (click)="deleteItem(item)">
                <ion-icon name="trash-outline"></ion-icon>
              </button>
            </div>
          }
        </div>
      }
    </ion-content>

    <ion-fab slot="fixed" vertical="bottom" horizontal="end">
      <ion-fab-button color="primary" (click)="openModal()">
        <ion-icon name="add-outline"></ion-icon>
      </ion-fab-button>
    </ion-fab>

    <ion-modal [isOpen]="modalOpen()" (didDismiss)="closeModal()">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button (click)="closeModal()">Cancel</ion-button>
            </ion-buttons>
            <ion-title>Add Accommodation</ion-title>
            <ion-buttons slot="end">
              <ion-button [strong]="true" [disabled]="!canSave() || saving()" (click)="save()">
                @if (saving()) { <ion-spinner name="crescent" style="width:18px;height:18px"></ion-spinner> }
                @else { Save }
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          @if (destinations().length === 0) {
            <div class="no-dest-warn">
              Add a destination first before adding accommodations.
            </div>
          } @else {
            <div class="form-card">
              <ion-item lines="none">
                <ion-label position="stacked">Name <span class="req">*</span></ion-label>
                <ion-input [(ngModel)]="form.name" placeholder="e.g. Hotel du Louvre" autocapitalize="words"></ion-input>
              </ion-item>
              <ion-item lines="none">
                <ion-label position="stacked">Check-in <span class="req">*</span></ion-label>
                <ion-input [(ngModel)]="form.checkIn" type="date"></ion-input>
              </ion-item>
              <ion-item lines="none">
                <ion-label position="stacked">Check-out <span class="req">*</span></ion-label>
                <ion-input [(ngModel)]="form.checkOut" type="date"></ion-input>
              </ion-item>
              <ion-item lines="none">
                <ion-label position="stacked">Address</ion-label>
                <ion-input [(ngModel)]="form.address" placeholder="Optional" autocapitalize="words"></ion-input>
              </ion-item>
              <ion-item lines="none">
                <ion-label position="stacked">Price (optional)</ion-label>
                <ion-input [(ngModel)]="form.price" type="number" placeholder="0.00" min="0"></ion-input>
              </ion-item>
            </div>
          }
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .list-wrap { padding: 16px 16px 100px; }

    .acc-card {
      display: flex; align-items: flex-start; gap: 12px;
      background: #fff; border-radius: 14px; padding: 14px;
      margin-bottom: 10px; box-shadow: 0 1px 8px rgba(15,23,42,0.06);
    }
    .acc-icon {
      width: 40px; height: 40px; border-radius: 12px; background: #eff6ff;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; color: #2563eb; flex-shrink: 0;
    }
    .acc-info { flex: 1; }
    .acc-name { font-size: 0.95rem; font-weight: 700; color: #0f172a; }
    .acc-dates { font-size: 0.78rem; color: #64748b; margin-top: 3px; }
    .acc-address { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
    .acc-price { font-size: 0.82rem; font-weight: 600; color: #2563eb; margin-top: 4px; }
    .delete-btn {
      background: none; border: none; color: #ef4444; font-size: 1.1rem; cursor: pointer; padding: 4px;
    }

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

    .form-card {
      background: #fff; border-radius: 14px; overflow: hidden;
      box-shadow: 0 1px 8px rgba(15,23,42,0.06);
    }
    .no-dest-warn {
      background: #fef3c7; border-radius: 12px; padding: 16px;
      font-size: 0.9rem; color: #92400e; text-align: center;
    }
    .req { color: #ef4444; }
  `],
})
export class AccommodationsPage {
  private readonly tripStore = inject(TripStore);
  private readonly api = inject(AccommodationApiService);
  private readonly destApi = inject(DestinationsApiService);

  readonly items = signal<Accommodation[]>([]);
  readonly destinations = signal<Destination[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);

  form = { name: '', checkIn: '', checkOut: '', address: '', price: null as number | null };

  canSave(): boolean {
    return !!this.form.name.trim() && !!this.form.checkIn && !!this.form.checkOut
      && this.destinations().length > 0;
  }

  constructor() {
    addIcons({ addOutline, bedOutline, trashOutline, businessOutline });
    this.load();
  }

  private load(): void {
    const id = this.tripStore.activeTripId();
    if (!id) return;
    this.loading.set(true);
    this.api.getAccommodationsByTrip(id).subscribe({
      next: (items) => { this.items.set(items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.destApi.getDestinations(id).subscribe({
      next: (dests) => this.destinations.set(dests),
    });
  }

  openModal(): void {
    this.form = { name: '', checkIn: '', checkOut: '', address: '', price: null };
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  save(): void {
    const dests = this.destinations();
    if (!this.canSave() || dests.length === 0) return;
    this.saving.set(true);
    // Associate with the first destination (simplest approach for mobile)
    const destId = dests[0].id;
    this.api.createAccommodation(destId, {
      name: this.form.name.trim(),
      checkIn: this.form.checkIn,
      checkOut: this.form.checkOut,
      address: this.form.address.trim() || undefined,
      price: this.form.price ?? undefined,
    }).subscribe({
      next: (item) => {
        this.items.update((list) => [...list, item]);
        this.saving.set(false);
        this.closeModal();
      },
      error: () => this.saving.set(false),
    });
  }

  deleteItem(item: Accommodation): void {
    this.api.deleteAccommodation(item.id).subscribe({
      next: () => this.items.update((list) => list.filter((i) => i.id !== item.id)),
    });
  }
}
