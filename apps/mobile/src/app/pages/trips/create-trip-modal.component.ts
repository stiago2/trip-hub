import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
  IonItem, IonLabel, IonInput, IonTextarea, IonDatetime,
  IonDatetimeButton, IonModal, IonSpinner, ModalController,
} from '@ionic/angular/standalone';
import { TripsStore } from '@org/feature-trips';
import { TripStore } from '@org/data-access-trips';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-trip-modal',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
    IonItem, IonLabel, IonInput, IonTextarea, IonDatetime,
    IonDatetimeButton, IonModal, IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">Cancel</ion-button>
        </ion-buttons>
        <ion-title>New Trip</ion-title>
        <ion-buttons slot="end">
          <ion-button [strong]="true" [disabled]="!canSave() || saving()" (click)="save()">
            @if (saving()) {
              <ion-spinner name="crescent" style="width:18px;height:18px"></ion-spinner>
            } @else {
              Save
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="form-section">
        <ion-item class="form-item">
          <ion-label position="stacked">Trip name <span class="required">*</span></ion-label>
          <ion-input
            [(ngModel)]="title"
            placeholder="Where are you going?"
            [maxlength]="80"
            autocapitalize="sentences"
          ></ion-input>
        </ion-item>

        <ion-item class="form-item">
          <ion-label position="stacked">Description</ion-label>
          <ion-textarea
            [(ngModel)]="description"
            placeholder="A short description (optional)"
            [rows]="3"
            autocapitalize="sentences"
          ></ion-textarea>
        </ion-item>
      </div>

      <div class="form-section">
        <div class="section-title">Dates</div>

        <div class="date-row">
          <div class="date-field">
            <div class="date-label">Start date <span class="required">*</span></div>
            <ion-datetime-button datetime="start-picker"></ion-datetime-button>
            <ion-modal [keepContentsMounted]="true">
              <ng-template>
                <ion-datetime
                  id="start-picker"
                  presentation="date"
                  [(ngModel)]="startDate"
                  [min]="today"
                  preferWheel="false"
                ></ion-datetime>
              </ng-template>
            </ion-modal>
          </div>

          <div class="date-field">
            <div class="date-label">End date <span class="required">*</span></div>
            <ion-datetime-button datetime="end-picker"></ion-datetime-button>
            <ion-modal [keepContentsMounted]="true">
              <ng-template>
                <ion-datetime
                  id="end-picker"
                  presentation="date"
                  [(ngModel)]="endDate"
                  [min]="startDate || today"
                  preferWheel="false"
                ></ion-datetime>
              </ng-template>
            </ion-modal>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .form-section {
      background: #fff;
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 20px;
      box-shadow: 0 1px 8px rgba(15,23,42,0.06);
    }

    .form-item {
      --padding-start: 16px;
      --inner-padding-end: 16px;
      --background: transparent;
    }

    .section-title {
      padding: 14px 16px 6px;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
    }

    .date-row {
      display: flex;
      gap: 0;
    }

    .date-field {
      flex: 1;
      padding: 10px 16px 14px;
      border-right: 1px solid #f1f5f9;
    }
    .date-field:last-child { border-right: none; }

    .date-label {
      font-size: 0.78rem;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .required { color: #ef4444; }
  `],
})
export class CreateTripModalComponent {
  private readonly modalCtrl = inject(ModalController);
  private readonly tripsStore = inject(TripsStore);
  private readonly tripStore = inject(TripStore);
  private readonly router = inject(Router);

  title = '';
  description = '';
  startDate = '';
  endDate = '';
  readonly saving = signal(false);
  readonly today = new Date().toISOString().split('T')[0];

  canSave(): boolean {
    return this.title.trim().length > 0 && !!this.startDate && !!this.endDate;
  }

  dismiss(): void {
    this.modalCtrl.dismiss();
  }

  save(): void {
    if (!this.canSave()) return;
    this.saving.set(true);
    this.tripsStore.createTrip(
      {
        title: this.title.trim(),
        description: this.description.trim() || undefined,
        startDate: this.startDate.split('T')[0],
        endDate: this.endDate.split('T')[0],
      },
      (trip) => {
        this.saving.set(false);
        this.modalCtrl.dismiss(trip);
        this.tripStore.setActiveTrip(trip.id);
        this.router.navigate(['/trip', trip.id, 'overview']);
      },
      () => {
        this.saving.set(false);
      },
    );
  }
}
