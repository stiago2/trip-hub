import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DocumentImportApiService,
  DocumentExtractionResult,
  ExtractedTransportData,
  ExtractedAccommodationData,
} from '@org/data-access-trips';
import { TransportApiService, CreateTransportPayload } from '@org/data-access-trips';
import { AccommodationApiService, CreateAccommodationPayload } from '@org/data-access-trips';
import { DestinationsStore } from '@org/feature-destinations';
import { Destination } from '@org/util-types';

type Step = 'upload' | 'analyzing' | 'preview' | 'success';

@Component({
  selector: 'lib-import-document-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="backdrop" (click)="onBackdropClick($event)">
      <div class="modal" role="dialog" aria-modal="true">

        <!-- Header -->
        <div class="modal-header">
          <div class="modal-title-row">
            <div class="modal-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            </div>
            <h2 class="modal-title">Import Travel Document</h2>
          </div>
          <button class="close-btn" (click)="closed.emit()" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- STEP: Upload -->
        @if (step() === 'upload') {
          <div class="modal-body">
            <p class="step-hint">Upload a booking confirmation, ticket, or itinerary. We'll extract the details automatically.</p>

            <div
              class="drop-zone"
              [class.drag-over]="isDragging()"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave()"
              (drop)="onDrop($event)"
              (click)="fileInput.click()"
            >
              <input
                #fileInput
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style="display:none"
                (change)="onFileSelected($event)"
              />
              <div class="drop-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              @if (selectedFile()) {
                <p class="drop-filename">{{ selectedFile()!.name }}</p>
                <p class="drop-sub">Click to change file</p>
              } @else {
                <p class="drop-label">Drag & drop or click to upload</p>
                <p class="drop-sub">PDF, JPG, PNG — max 10 MB</p>
              }
            </div>

            @if (uploadError()) {
              <p class="error-msg">{{ uploadError() }}</p>
            }
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="closed.emit()">Cancel</button>
            <button
              class="btn-primary"
              [disabled]="!selectedFile()"
              (click)="analyzeDocument()"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              Analyze Document
            </button>
          </div>
        }

        <!-- STEP: Analyzing -->
        @if (step() === 'analyzing') {
          <div class="modal-body analyzing-body">
            <div class="analyzing-spinner">
              <div class="spinner-ring"></div>
            </div>
            <p class="analyzing-label">Analyzing document...</p>
            <p class="analyzing-sub">Extracting travel details with AI</p>
          </div>
        }

        <!-- STEP: Preview (Transport) -->
        @if (step() === 'preview' && extractedType() === 'transport') {
          <div class="modal-body">
            <div class="result-badge result-badge--transport">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.72a16 16 0 0 0 6 6l.72-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.28 16a2 2 0 0 1 .72.92z"/></svg>
              Transport detected
            </div>

            <div class="form-grid">
              <div class="form-field">
                <label>Type</label>
                <div class="type-pills">
                  @for (t of transportTypes; track t) {
                    <button
                      class="type-pill"
                      [class.active]="transportForm.type === t"
                      (click)="transportForm.type = t"
                    >{{ t }}</button>
                  }
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-field">
                  <label>From</label>
                  <input type="text" [(ngModel)]="transportForm.fromLocation" placeholder="City or airport" />
                </div>
                <div class="form-field">
                  <label>To</label>
                  <input type="text" [(ngModel)]="transportForm.toLocation" placeholder="City or airport" />
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-field">
                  <label>Departure</label>
                  <input type="datetime-local" [(ngModel)]="transportForm.departureTime" />
                </div>
                <div class="form-field">
                  <label>Arrival</label>
                  <input type="datetime-local" [(ngModel)]="transportForm.arrivalTime" />
                </div>
              </div>

              <div class="form-field form-field--half">
                <label>Price (optional)</label>
                <input type="number" [(ngModel)]="transportForm.price" placeholder="0.00" min="0" />
              </div>
            </div>

            @if (saveError()) {
              <p class="error-msg">{{ saveError() }}</p>
            }
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="resetToUpload()">← Back</button>
            <button class="btn-primary" [disabled]="isSaving()" (click)="saveTransport()">
              @if (isSaving()) { Saving... } @else { Add to Trip }
            </button>
          </div>
        }

        <!-- STEP: Preview (Accommodation) -->
        @if (step() === 'preview' && extractedType() === 'accommodation') {
          <div class="modal-body">
            <div class="result-badge result-badge--accommodation">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Accommodation detected
            </div>

            <div class="form-grid">
              <div class="form-field">
                <label>Property name</label>
                <input type="text" [(ngModel)]="accommodationForm.name" placeholder="Hotel / Airbnb name" />
              </div>

              <div class="form-row-2">
                <div class="form-field">
                  <label>Check-in</label>
                  <input type="datetime-local" [(ngModel)]="accommodationForm.checkIn" />
                </div>
                <div class="form-field">
                  <label>Check-out</label>
                  <input type="datetime-local" [(ngModel)]="accommodationForm.checkOut" />
                </div>
              </div>

              <div class="form-field">
                <label>Address (optional)</label>
                <input type="text" [(ngModel)]="accommodationForm.address" placeholder="Street address" />
              </div>

              <div class="form-field form-field--half">
                <label>Total price (optional)</label>
                <input type="number" [(ngModel)]="accommodationForm.price" placeholder="0.00" min="0" />
              </div>

              @if (destinations().length > 0) {
                <div class="form-field">
                  <label>Destination <span class="required">*</span></label>
                  <select [(ngModel)]="accommodationForm.destinationId">
                    <option value="">Select a destination</option>
                    @for (dest of destinations(); track dest.id) {
                      <option [value]="dest.id">{{ dest.city }}, {{ dest.country }}</option>
                    }
                  </select>
                </div>
              } @else {
                <p class="warn-msg">Add a destination to this trip first before importing accommodations.</p>
              }
            </div>

            @if (saveError()) {
              <p class="error-msg">{{ saveError() }}</p>
            }
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="resetToUpload()">← Back</button>
            <button
              class="btn-primary"
              [disabled]="isSaving() || !accommodationForm.destinationId"
              (click)="saveAccommodation()"
            >
              @if (isSaving()) { Saving... } @else { Add to Trip }
            </button>
          </div>
        }

        <!-- STEP: Success -->
        @if (step() === 'success') {
          <div class="modal-body success-body">
            <div class="success-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p class="success-label">Added to your trip!</p>
            <p class="success-sub">The {{ successType() }} has been added successfully.</p>
          </div>

          <div class="modal-footer">
            <button class="btn-primary" (click)="closed.emit()">Done</button>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(15,23,42,0.55); backdrop-filter: blur(3px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

    .modal {
      background: white; border-radius: 16px;
      width: 100%; max-width: 520px;
      box-shadow: 0 24px 64px rgba(15,23,42,0.18);
      animation: slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1);
      display: flex; flex-direction: column;
    }
    @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }

    /* Header */
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .modal-title-row { display: flex; align-items: center; gap: 10px; }
    .modal-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center; color: white;
    }
    .modal-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
    .close-btn {
      width: 32px; height: 32px; border-radius: 8px;
      background: none; border: none; cursor: pointer; color: #94a3b8;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .close-btn:hover { background: #f1f5f9; color: #475569; }

    /* Body */
    .modal-body { padding: 20px 24px; }

    .step-hint {
      font-size: 0.875rem; color: #64748b; margin: 0 0 16px; line-height: 1.5;
    }

    /* Drop zone */
    .drop-zone {
      border: 2px dashed #cbd5e1; border-radius: 12px;
      padding: 32px 20px; text-align: center; cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .drop-zone:hover, .drop-zone.drag-over {
      border-color: #6366f1; background: #f5f3ff;
    }
    .drop-icon { color: #94a3b8; margin-bottom: 12px; }
    .drop-zone.drag-over .drop-icon { color: #6366f1; }
    .drop-label { font-size: 0.9rem; font-weight: 600; color: #334155; margin: 0 0 4px; }
    .drop-filename { font-size: 0.875rem; font-weight: 600; color: #6366f1; margin: 0 0 4px; }
    .drop-sub { font-size: 0.78rem; color: #94a3b8; margin: 0; }

    /* Analyzing */
    .analyzing-body {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 40px 24px;
    }
    .analyzing-spinner {
      width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;
    }
    .spinner-ring {
      width: 44px; height: 44px; border-radius: 50%;
      border: 3px solid #e2e8f0; border-top-color: #6366f1;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg) } }
    .analyzing-label { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
    .analyzing-sub { font-size: 0.875rem; color: #94a3b8; margin: 0; }

    /* Result badge */
    .result-badge {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 0.78rem; font-weight: 600; padding: 5px 12px;
      border-radius: 20px; margin-bottom: 16px;
    }
    .result-badge--transport { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
    .result-badge--accommodation { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

    /* Form */
    .form-grid { display: flex; flex-direction: column; gap: 14px; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-field { display: flex; flex-direction: column; gap: 5px; }
    .form-field--half { max-width: 200px; }
    .form-field label {
      font-size: 0.78rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .required { color: #ef4444; }
    .form-field input, .form-field select {
      padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #0f172a; outline: none; background: white;
      transition: border-color 0.15s;
    }
    .form-field input:focus, .form-field select:focus { border-color: #6366f1; }

    /* Type pills */
    .type-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .type-pill {
      padding: 5px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 600;
      border: 1.5px solid #e2e8f0; background: white; cursor: pointer; color: #475569;
      transition: all 0.15s;
    }
    .type-pill.active { background: #6366f1; border-color: #6366f1; color: white; }
    .type-pill:hover:not(.active) { border-color: #6366f1; color: #6366f1; }

    /* Success */
    .success-body {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 40px 24px;
    }
    .success-icon {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      display: flex; align-items: center; justify-content: center; color: white;
    }
    .success-label { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0; }
    .success-sub { font-size: 0.875rem; color: #64748b; margin: 0; }

    /* Messages */
    .error-msg {
      font-size: 0.8rem; color: #ef4444; background: #fef2f2;
      border: 1px solid #fecaca; border-radius: 8px; padding: 8px 12px; margin-top: 12px;
    }
    .warn-msg {
      font-size: 0.8rem; color: #92400e; background: #fffbeb;
      border: 1px solid #fde68a; border-radius: 8px; padding: 8px 12px;
    }

    /* Footer */
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 24px 20px;
      border-top: 1px solid #f1f5f9;
    }
    .btn-cancel {
      padding: 9px 16px; border-radius: 8px; font-size: 0.875rem; font-weight: 600;
      border: 1.5px solid #e2e8f0; background: white; color: #475569; cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .btn-cancel:hover { background: #f8fafc; border-color: #cbd5e1; }
    .btn-primary {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 20px; border-radius: 8px; font-size: 0.875rem; font-weight: 600;
      background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
      border: none; cursor: pointer; transition: opacity 0.15s;
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class ImportDocumentModalComponent {
  readonly tripId = input.required<string>();
  readonly closed = output<void>();
  readonly imported = output<void>();

  private readonly documentImportApi = inject(DocumentImportApiService);
  private readonly transportApi = inject(TransportApiService);
  private readonly accommodationApi = inject(AccommodationApiService);
  private readonly destinationsStore = inject(DestinationsStore);

  readonly destinations = computed((): Destination[] => this.destinationsStore.destinations());

  readonly step = signal<Step>('upload');
  readonly selectedFile = signal<File | null>(null);
  readonly isDragging = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly extractedType = signal<'transport' | 'accommodation' | null>(null);
  readonly successType = signal<string>('entry');

  readonly transportTypes = ['FLIGHT', 'TRAIN', 'BUS', 'CAR'] as const;

  transportForm: ExtractedTransportData = {
    type: 'FLIGHT',
    fromLocation: '',
    toLocation: '',
    departureTime: '',
    arrivalTime: '',
    price: undefined,
  };

  accommodationForm: ExtractedAccommodationData & { destinationId: string } = {
    name: '',
    checkIn: '',
    checkOut: '',
    address: '',
    price: undefined,
    destinationId: '',
  };

  @HostListener('document:keydown.escape')
  onEscape() { this.closed.emit(); }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('backdrop')) {
      this.closed.emit();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave() { this.isDragging.set(false); }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File) {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      this.uploadError.set('Only PDF, JPG, and PNG files are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.uploadError.set('File is too large. Maximum size is 10 MB.');
      return;
    }
    this.uploadError.set(null);
    this.selectedFile.set(file);
  }

  analyzeDocument() {
    const file = this.selectedFile();
    if (!file) return;

    this.step.set('analyzing');
    this.uploadError.set(null);

    this.documentImportApi.importDocument(this.tripId(), file).subscribe({
      next: (result: DocumentExtractionResult) => {
        this.extractedType.set(result.type);
        if (result.type === 'transport') {
          const d = result.data;
          this.transportForm = {
            type: d.type,
            fromLocation: d.fromLocation,
            toLocation: d.toLocation,
            departureTime: this.toDatetimeLocal(d.departureTime),
            arrivalTime: this.toDatetimeLocal(d.arrivalTime),
            price: d.price ?? undefined,
          };
        } else {
          const d = result.data;
          const firstDestId = this.destinations()[0]?.id ?? '';
          this.accommodationForm = {
            name: d.name,
            checkIn: this.toDatetimeLocal(d.checkIn),
            checkOut: this.toDatetimeLocal(d.checkOut),
            address: d.address ?? '',
            price: d.price ?? undefined,
            destinationId: firstDestId,
          };
        }
        this.step.set('preview');
      },
      error: (err) => {
        this.uploadError.set(err?.error?.message ?? 'Failed to analyze document. Please try again.');
        this.step.set('upload');
      },
    });
  }

  saveTransport() {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    this.saveError.set(null);

    const payload: CreateTransportPayload = {
      type: this.transportForm.type,
      fromLocation: this.transportForm.fromLocation,
      toLocation: this.transportForm.toLocation,
      departureTime: new Date(this.transportForm.departureTime).toISOString(),
      arrivalTime: new Date(this.transportForm.arrivalTime).toISOString(),
      ...(this.transportForm.price != null ? { price: Number(this.transportForm.price) } : {}),
    };

    this.transportApi.createTransport(this.tripId(), payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successType.set('transport');
        this.step.set('success');
        this.imported.emit();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.saveError.set(err?.error?.message ?? 'Failed to save transport. Please try again.');
      },
    });
  }

  saveAccommodation() {
    if (this.isSaving() || !this.accommodationForm.destinationId) return;
    this.isSaving.set(true);
    this.saveError.set(null);

    const payload: CreateAccommodationPayload = {
      name: this.accommodationForm.name,
      checkIn: new Date(this.accommodationForm.checkIn).toISOString(),
      checkOut: new Date(this.accommodationForm.checkOut).toISOString(),
      ...(this.accommodationForm.address ? { address: this.accommodationForm.address } : {}),
      ...(this.accommodationForm.price != null ? { price: Number(this.accommodationForm.price) } : {}),
    };

    this.accommodationApi
      .createAccommodation(this.accommodationForm.destinationId, payload)
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.successType.set('accommodation');
          this.step.set('success');
          this.imported.emit();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.saveError.set(
            err?.error?.message ?? 'Failed to save accommodation. Please try again.',
          );
        },
      });
  }

  resetToUpload() {
    this.step.set('upload');
    this.saveError.set(null);
  }

  private toDatetimeLocal(isoString: string): string {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  }
}
