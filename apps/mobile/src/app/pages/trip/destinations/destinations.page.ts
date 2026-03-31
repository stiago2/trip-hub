import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonFab, IonFabButton, IonIcon, IonSpinner, IonSkeletonText,
  IonModal, IonButton, IonItem, IonLabel, IonInput, IonTextarea,
  IonDatetime, IonDatetimeButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, mapOutline, trashOutline, locationOutline } from 'ionicons/icons';
import { TripStore, DestinationsApiService } from '@org/data-access-trips';
import { Destination } from '@org/util-types';

@Component({
  selector: 'app-destinations',
  standalone: true,
  imports: [
    DatePipe, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonFab, IonFabButton, IonIcon, IonSpinner, IonSkeletonText,
    IonModal, IonButton, IonItem, IonLabel, IonInput, IonTextarea,
    IonDatetime, IonDatetimeButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>Destinations</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (loading()) {
        <div class="list-wrap">
          @for (i of [1,2,3]; track i) {
            <ion-skeleton-text animated style="height:80px;border-radius:14px;margin-bottom:10px"></ion-skeleton-text>
          }
        </div>
      } @else if (destinations().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><ion-icon name="map-outline"></ion-icon></div>
          <h3>No destinations yet</h3>
          <p>Tap + to add your first stop</p>
        </div>
      } @else {
        <div class="list-wrap">
          @for (dest of destinations(); track dest.id) {
            <div class="dest-card">
              <div class="dest-icon"><ion-icon name="location-outline"></ion-icon></div>
              <div class="dest-info">
                <div class="dest-city">{{ dest.city }}, {{ dest.country }}</div>
                <div class="dest-dates">
                  {{ dest.startDate | date:'MMM d' }} – {{ dest.endDate | date:'MMM d, y' }}
                </div>
                @if (dest.notes) {
                  <div class="dest-notes">{{ dest.notes }}</div>
                }
              </div>
              <button class="delete-btn" (click)="deleteDest(dest)">
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
            <ion-title>Add Destination</ion-title>
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
              <ion-label position="stacked">City <span class="req">*</span></ion-label>
              <ion-input [(ngModel)]="form.city" placeholder="e.g. Paris" autocapitalize="words"></ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Country <span class="req">*</span></ion-label>
              <ion-input [(ngModel)]="form.country" placeholder="e.g. France" autocapitalize="words"></ion-input>
            </ion-item>
          </div>

          <div class="form-card" style="margin-top:16px">
            <div class="date-row">
              <div class="date-field">
                <div class="date-label">Arrival <span class="req">*</span></div>
                <ion-datetime-button datetime="dest-start"></ion-datetime-button>
                <ion-modal [keepContentsMounted]="true">
                  <ng-template>
                    <ion-datetime id="dest-start" presentation="date" [(ngModel)]="form.startDate"></ion-datetime>
                  </ng-template>
                </ion-modal>
              </div>
              <div class="date-field">
                <div class="date-label">Departure <span class="req">*</span></div>
                <ion-datetime-button datetime="dest-end"></ion-datetime-button>
                <ion-modal [keepContentsMounted]="true">
                  <ng-template>
                    <ion-datetime id="dest-end" presentation="date" [(ngModel)]="form.endDate" [min]="form.startDate"></ion-datetime>
                  </ng-template>
                </ion-modal>
              </div>
            </div>
          </div>

          <div class="form-card" style="margin-top:16px">
            <ion-item lines="none">
              <ion-label position="stacked">Notes</ion-label>
              <ion-textarea [(ngModel)]="form.notes" placeholder="Optional notes" [rows]="3" autocapitalize="sentences"></ion-textarea>
            </ion-item>
          </div>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .list-wrap { padding: 16px 16px 100px; }

    .dest-card {
      display: flex; align-items: flex-start; gap: 12px;
      background: #fff; border-radius: 14px; padding: 14px;
      margin-bottom: 10px; box-shadow: 0 1px 8px rgba(15,23,42,0.06);
    }
    .dest-icon {
      width: 40px; height: 40px; border-radius: 12px; background: #eff6ff;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; color: #2563eb; flex-shrink: 0;
    }
    .dest-info { flex: 1; }
    .dest-city { font-size: 0.95rem; font-weight: 700; color: #0f172a; }
    .dest-dates { font-size: 0.78rem; color: #64748b; margin-top: 3px; }
    .dest-notes { font-size: 0.78rem; color: #94a3b8; margin-top: 4px; line-height: 1.4; }
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
    .date-row { display: flex; }
    .date-field { flex: 1; padding: 12px 16px; border-right: 1px solid #f1f5f9; }
    .date-field:last-child { border-right: none; }
    .date-label { font-size: 0.78rem; color: #64748b; font-weight: 500; margin-bottom: 8px; }
    .req { color: #ef4444; }
  `],
})
export class DestinationsPage {
  private readonly tripStore = inject(TripStore);
  private readonly api = inject(DestinationsApiService);

  readonly destinations = signal<Destination[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);

  form = { city: '', country: '', startDate: '', endDate: '', notes: '' };

  canSave(): boolean {
    return !!this.form.city.trim() && !!this.form.country.trim() && !!this.form.startDate && !!this.form.endDate;
  }

  constructor() {
    addIcons({ addOutline, mapOutline, trashOutline, locationOutline });
    this.load();
  }

  private load(): void {
    const id = this.tripStore.activeTripId();
    if (!id) return;
    this.loading.set(true);
    this.api.getDestinations(id).subscribe({
      next: (dests) => { this.destinations.set(dests); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openModal(): void {
    this.form = { city: '', country: '', startDate: '', endDate: '', notes: '' };
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  save(): void {
    const id = this.tripStore.activeTripId();
    if (!id || !this.canSave()) return;
    this.saving.set(true);
    this.api.createDestination(id, {
      city: this.form.city.trim(),
      country: this.form.country.trim(),
      startDate: this.form.startDate.split('T')[0],
      endDate: this.form.endDate.split('T')[0],
      notes: this.form.notes.trim() || undefined,
    }).subscribe({
      next: (dest) => {
        this.destinations.update((list) => [...list, dest]);
        this.saving.set(false);
        this.closeModal();
      },
      error: () => this.saving.set(false),
    });
  }

  deleteDest(dest: Destination): void {
    this.api.deleteDestination(dest.id).subscribe({
      next: () => this.destinations.update((list) => list.filter((d) => d.id !== dest.id)),
    });
  }
}
