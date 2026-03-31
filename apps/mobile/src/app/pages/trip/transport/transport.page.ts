import { Component, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonFab, IonFabButton, IonIcon, IonSpinner, IonSkeletonText,
  IonModal, IonButton, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, airplaneOutline, trainOutline, busOutline, carOutline, trashOutline, arrowForwardOutline } from 'ionicons/icons';
import { TripStore, TransportApiService } from '@org/data-access-trips';
import { Transport, TransportType } from '@org/util-types';

const TYPE_ICONS: Record<TransportType, string> = {
  FLIGHT: 'airplane-outline', TRAIN: 'train-outline', BUS: 'bus-outline', CAR: 'car-outline',
};

@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [
    DatePipe, CurrencyPipe, TitleCasePipe, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonFab, IonFabButton, IonIcon, IonSpinner, IonSkeletonText,
    IonModal, IonButton, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>Transport</ion-title>
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
          <div class="empty-icon"><ion-icon name="airplane-outline"></ion-icon></div>
          <h3>No transport yet</h3>
          <p>Tap + to add flights, trains, or other transport</p>
        </div>
      } @else {
        <div class="list-wrap">
          @for (item of items(); track item.id) {
            <div class="transport-card">
              <div class="type-icon">
                <ion-icon [name]="typeIcon(item.type)"></ion-icon>
              </div>
              <div class="transport-info">
                <div class="route">
                  {{ item.fromLocation }}
                  <ion-icon name="arrow-forward-outline" style="font-size:0.8rem;margin:0 4px"></ion-icon>
                  {{ item.toLocation }}
                </div>
                <div class="transport-meta">
                  {{ item.departureTime | date:'MMM d, HH:mm' }}
                  @if (item.price) { · {{ item.price | currency }} }
                </div>
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
            <ion-title>Add Transport</ion-title>
            <ion-buttons slot="end">
              <ion-button [strong]="true" [disabled]="!canSave() || saving()" (click)="save()">
                @if (saving()) { <ion-spinner name="crescent" style="width:18px;height:18px"></ion-spinner> }
                @else { Save }
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="form-card">
            <ion-item lines="none">
              <ion-label position="stacked">Type</ion-label>
              <ion-select [(ngModel)]="form.type" interface="action-sheet">
                @for (t of types; track t) {
                  <ion-select-option [value]="t">{{ t | titlecase }}</ion-select-option>
                }
              </ion-select>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">From <span class="req">*</span></ion-label>
              <ion-input [(ngModel)]="form.fromLocation" placeholder="e.g. New York JFK" autocapitalize="words"></ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">To <span class="req">*</span></ion-label>
              <ion-input [(ngModel)]="form.toLocation" placeholder="e.g. Paris CDG" autocapitalize="words"></ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Departure <span class="req">*</span></ion-label>
              <ion-input [(ngModel)]="form.departureTime" type="datetime-local"></ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Arrival <span class="req">*</span></ion-label>
              <ion-input [(ngModel)]="form.arrivalTime" type="datetime-local"></ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Price (optional)</ion-label>
              <ion-input [(ngModel)]="form.price" type="number" placeholder="0.00" min="0"></ion-input>
            </ion-item>
          </div>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .list-wrap { padding: 16px 16px 100px; }

    .transport-card {
      display: flex; align-items: center; gap: 12px;
      background: #fff; border-radius: 14px; padding: 14px;
      margin-bottom: 10px; box-shadow: 0 1px 8px rgba(15,23,42,0.06);
    }
    .type-icon {
      width: 40px; height: 40px; border-radius: 12px; background: #eff6ff;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; color: #2563eb; flex-shrink: 0;
    }
    .transport-info { flex: 1; }
    .route { font-size: 0.95rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; }
    .transport-meta { font-size: 0.75rem; color: #64748b; margin-top: 3px; }
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
    .req { color: #ef4444; }
  `],
})
export class TransportPage {
  private readonly tripStore = inject(TripStore);
  private readonly api = inject(TransportApiService);

  readonly items = signal<Transport[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);
  readonly types: TransportType[] = ['FLIGHT', 'TRAIN', 'BUS', 'CAR'];

  form = {
    type: 'FLIGHT' as TransportType,
    fromLocation: '', toLocation: '',
    departureTime: '', arrivalTime: '',
    price: null as number | null,
  };

  typeIcon(type: TransportType): string { return TYPE_ICONS[type]; }

  canSave(): boolean {
    return !!this.form.fromLocation.trim() && !!this.form.toLocation.trim()
      && !!this.form.departureTime && !!this.form.arrivalTime;
  }

  constructor() {
    addIcons({ addOutline, airplaneOutline, trainOutline, busOutline, carOutline, trashOutline, arrowForwardOutline });
    this.load();
  }

  private load(): void {
    const id = this.tripStore.activeTripId();
    if (!id) return;
    this.loading.set(true);
    this.api.getTransports(id).subscribe({
      next: (items) => { this.items.set(items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openModal(): void {
    this.form = { type: 'FLIGHT', fromLocation: '', toLocation: '', departureTime: '', arrivalTime: '', price: null };
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  save(): void {
    const id = this.tripStore.activeTripId();
    if (!id || !this.canSave()) return;
    this.saving.set(true);
    this.api.createTransport(id, {
      type: this.form.type,
      fromLocation: this.form.fromLocation.trim(),
      toLocation: this.form.toLocation.trim(),
      departureTime: new Date(this.form.departureTime).toISOString(),
      arrivalTime: new Date(this.form.arrivalTime).toISOString(),
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

  deleteItem(item: Transport): void {
    this.api.deleteTransport(item.id).subscribe({
      next: () => this.items.update((list) => list.filter((i) => i.id !== item.id)),
    });
  }
}
