import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonSpinner, IonIcon, ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { documentOutline, cloudUploadOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { TripStore, DocumentImportApiService, TransportApiService, AccommodationApiService, DestinationsApiService } from '@org/data-access-trips';
import { DocumentExtractionResult } from '@org/util-types';

type Phase = 'idle' | 'analyzing' | 'preview' | 'saving' | 'done' | 'error';

@Component({
  selector: 'app-import-document-modal',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonSpinner, IonIcon,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">Close</ion-button>
        </ion-buttons>
        <ion-title>Import Document</ion-title>
        @if (phase() === 'preview') {
          <ion-buttons slot="end">
            <ion-button [strong]="true" (click)="save()" [disabled]="phase() === 'saving'">
              @if (phase() === 'saving') {
                <ion-spinner name="crescent" style="width:18px;height:18px"></ion-spinner>
              } @else {
                Save
              }
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>

    <ion-content>

      <!-- Idle: file picker -->
      @if (phase() === 'idle') {
        <div class="state-wrap">
          <div class="upload-zone" (click)="fileInput.click()">
            <ion-icon name="cloud-upload-outline"></ion-icon>
            <div class="upload-title">Upload a travel document</div>
            <div class="upload-sub">PDF, JPG, or PNG — max 10 MB</div>
            <div class="upload-hint">Tap to browse files</div>
          </div>
          <input
            #fileInput type="file" accept=".pdf,.jpg,.jpeg,.png"
            style="display:none"
            (change)="onFileSelected($event)"
          />
          @if (errorMsg()) {
            <div class="error-banner">{{ errorMsg() }}</div>
          }
        </div>
      }

      <!-- Analyzing -->
      @if (phase() === 'analyzing') {
        <div class="state-wrap">
          <ion-spinner name="crescent" style="width:56px;height:56px;color:#2563eb"></ion-spinner>
          <div class="state-title" style="margin-top:16px">Analyzing document…</div>
          <div class="state-sub">AI is extracting travel details</div>
        </div>
      }

      <!-- Preview -->
      @if (phase() === 'preview' && extracted()) {
        <div class="preview-wrap">
          <div class="preview-header">
            <ion-icon name="checkmark-circle-outline" style="color:#16a34a;font-size:1.8rem"></ion-icon>
            <div>
              <div class="preview-type">
                {{ extracted()!.type === 'transport' ? 'Transport detected' : 'Accommodation detected' }}
              </div>
              <div class="preview-sub">Review and save to your trip</div>
            </div>
          </div>

          @if (extracted()!.type === 'transport') {
            <div class="data-card">
              <div class="data-row">
                <span class="data-label">Type</span>
                <span class="data-value">{{ extracted()!.data['type'] }}</span>
              </div>
              <div class="data-row">
                <span class="data-label">From</span>
                <span class="data-value">{{ extracted()!.data['fromLocation'] }}</span>
              </div>
              <div class="data-row">
                <span class="data-label">To</span>
                <span class="data-value">{{ extracted()!.data['toLocation'] }}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Departure</span>
                <span class="data-value">{{ extracted()!.data['departureTime'] }}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Arrival</span>
                <span class="data-value">{{ extracted()!.data['arrivalTime'] }}</span>
              </div>
              @if (extracted()!.data['price']) {
                <div class="data-row">
                  <span class="data-label">Price</span>
                  <span class="data-value">{{ extracted()!.data['price'] }}</span>
                </div>
              }
            </div>
          }

          @if (extracted()!.type === 'accommodation') {
            <div class="data-card">
              <div class="data-row">
                <span class="data-label">Name</span>
                <span class="data-value">{{ extracted()!.data['name'] }}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Check-in</span>
                <span class="data-value">{{ extracted()!.data['checkIn'] }}</span>
              </div>
              <div class="data-row">
                <span class="data-label">Check-out</span>
                <span class="data-value">{{ extracted()!.data['checkOut'] }}</span>
              </div>
              @if (extracted()!.data['address']) {
                <div class="data-row">
                  <span class="data-label">Address</span>
                  <span class="data-value">{{ extracted()!.data['address'] }}</span>
                </div>
              }
              @if (extracted()!.data['price']) {
                <div class="data-row">
                  <span class="data-label">Price</span>
                  <span class="data-value">{{ extracted()!.data['price'] }}</span>
                </div>
              }
            </div>
          }

          <button class="save-btn" (click)="save()" [disabled]="phase() === 'saving'">
            @if (phase() === 'saving') {
              <ion-spinner name="crescent" style="width:18px;height:18px;color:#fff"></ion-spinner>
            } @else {
              Save to trip
            }
          </button>
          <button class="retry-btn" (click)="reset()">Upload another document</button>
        </div>
      }

      <!-- Done -->
      @if (phase() === 'done') {
        <div class="state-wrap">
          <ion-icon name="checkmark-circle-outline" style="color:#16a34a;font-size:4rem"></ion-icon>
          <div class="state-title">Saved to trip!</div>
          <div class="state-sub">The details have been added to your trip.</div>
          <button class="save-btn" style="margin-top:8px" (click)="reset()">Import another</button>
        </div>
      }

      <!-- Error -->
      @if (phase() === 'error') {
        <div class="state-wrap">
          <ion-icon name="close-circle-outline" style="color:#ef4444;font-size:4rem"></ion-icon>
          <div class="state-title" style="color:#ef4444">Analysis failed</div>
          <div class="state-sub">{{ errorMsg() }}</div>
          <button class="retry-btn" style="margin-top:8px" (click)="reset()">Try again</button>
        </div>
      }

    </ion-content>
  `,
  styles: [`
    .state-wrap {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 48px 32px; gap: 10px; text-align: center;
      min-height: 60vh;
    }

    .upload-zone {
      width: 100%; border: 2px dashed #bfdbfe; border-radius: 20px;
      padding: 40px 24px; display: flex; flex-direction: column;
      align-items: center; gap: 10px; cursor: pointer; color: #2563eb;
      background: #f8fbff; transition: background 0.15s;
    }
    .upload-zone:active { background: #eff6ff; }
    .upload-zone ion-icon { font-size: 3rem; }
    .upload-title { font-size: 1rem; font-weight: 700; color: #0f172a; }
    .upload-sub { font-size: 0.82rem; color: #64748b; }
    .upload-hint { font-size: 0.78rem; color: #2563eb; font-weight: 600; margin-top: 4px; }

    .state-title { font-size: 1rem; font-weight: 700; color: #0f172a; }
    .state-sub { font-size: 0.88rem; color: #64748b; }

    .error-banner {
      margin-top: 12px; padding: 12px 16px; background: #fef2f2;
      border-radius: 12px; color: #dc2626; font-size: 0.85rem; width: 100%;
    }

    .preview-wrap { padding: 16px; }
    .preview-header {
      display: flex; align-items: center; gap: 12px;
      background: #f0fdf4; border-radius: 14px; padding: 16px;
      margin-bottom: 16px;
    }
    .preview-type { font-size: 0.95rem; font-weight: 700; color: #0f172a; }
    .preview-sub { font-size: 0.78rem; color: #64748b; margin-top: 2px; }

    .data-card {
      background: #fff; border-radius: 14px; overflow: hidden;
      box-shadow: 0 1px 8px rgba(15,23,42,0.06); margin-bottom: 16px;
    }
    .data-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 12px 16px; border-bottom: 1px solid #f1f5f9;
    }
    .data-row:last-child { border-bottom: none; }
    .data-label { font-size: 0.78rem; color: #94a3b8; font-weight: 600; flex-shrink: 0; margin-right: 12px; }
    .data-value { font-size: 0.88rem; color: #0f172a; font-weight: 500; text-align: right; }

    .save-btn {
      width: 100%; padding: 14px; background: #2563eb; color: white;
      border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      gap: 8px; margin-bottom: 10px;
    }
    .save-btn:disabled { opacity: 0.6; }
    .retry-btn {
      width: 100%; padding: 12px; background: transparent; color: #64748b;
      border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 0.9rem;
      font-weight: 500; cursor: pointer;
    }
  `],
})
export class ImportDocumentModalComponent {
  private readonly modalCtrl = inject(ModalController);
  private readonly tripStore = inject(TripStore);
  private readonly importApi = inject(DocumentImportApiService);
  private readonly transportApi = inject(TransportApiService);
  private readonly accommodationApi = inject(AccommodationApiService);
  private readonly destApi = inject(DestinationsApiService);

  readonly phase = signal<Phase>('idle');
  readonly extracted = signal<DocumentExtractionResult | null>(null);
  readonly errorMsg = signal<string | null>(null);

  constructor() {
    addIcons({ documentOutline, cloudUploadOutline, checkmarkCircleOutline, closeCircleOutline });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const id = this.tripStore.activeTripId();
    if (!id) { this.errorMsg.set('No active trip'); return; }
    this.phase.set('analyzing');
    this.importApi.importDocument(id, file).subscribe({
      next: (result) => { this.extracted.set(result); this.phase.set('preview'); },
      error: (err) => {
        this.errorMsg.set(err?.error?.message ?? 'Could not analyze document. Try a clearer image or PDF.');
        this.phase.set('error');
      },
    });
  }

  save(): void {
    const result = this.extracted();
    const id = this.tripStore.activeTripId();
    if (!result || !id) return;
    this.phase.set('saving');

    if (result.type === 'transport') {
      const d = result.data;
      this.transportApi.createTransport(id, {
        type: d.type,
        fromLocation: d.fromLocation,
        toLocation: d.toLocation,
        departureTime: d.departureTime,
        arrivalTime: d.arrivalTime,
        price: d.price ?? undefined,
      }).subscribe({
        next: () => this.phase.set('done'),
        error: () => { this.errorMsg.set('Failed to save transport'); this.phase.set('error'); },
      });
    } else {
      // Accommodation: needs a destination — get first one or fail gracefully
      this.destApi.getDestinations(id).subscribe({
        next: (dests) => {
          if (dests.length === 0) {
            this.errorMsg.set('Add a destination first before importing accommodations.');
            this.phase.set('error');
            return;
          }
          const d = result.data;
          this.accommodationApi.createAccommodation(dests[0].id, {
            name: d.name,
            checkIn: d.checkIn,
            checkOut: d.checkOut,
            address: d.address ?? undefined,
            price: d.price ?? undefined,
          }).subscribe({
            next: () => this.phase.set('done'),
            error: () => { this.errorMsg.set('Failed to save accommodation'); this.phase.set('error'); },
          });
        },
        error: () => { this.errorMsg.set('Failed to load destinations'); this.phase.set('error'); },
      });
    }
  }

  reset(): void {
    this.phase.set('idle');
    this.extracted.set(null);
    this.errorMsg.set(null);
  }

  dismiss(): void { this.modalCtrl.dismiss(); }
}
