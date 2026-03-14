import { Component, computed, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateTransportPayload, TransportType } from '@org/data-access-trips';
import { LocationAutocompleteInputComponent } from '@org/ui-components';

interface TypeOption {
  value: TransportType;
  label: string;
  icon: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: 'FLIGHT',
    label: 'Flight',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
  },
  {
    value: 'TRAIN',
    label: 'Train',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2H18v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zm0 2c3.51 0 5.44.49 5.93 1H6.07C6.56 4.49 8.49 4 12 4zM6 7h5v3H6V7zm12 0v3h-5V7h5zm-1 8H7c-.55 0-1-.45-1-1v-1h12v1c0 .55-.45 1-1 1z"/></svg>`,
  },
  {
    value: 'BUS',
    label: 'Bus',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm13-6H7V6h10v4zm-9 3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm8 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>`,
  },
  {
    value: 'CAR',
    label: 'Car',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`,
  },
];

@Component({
  selector: 'lib-add-transport-modal',
  standalone: true,
  imports: [ReactiveFormsModule, LocationAutocompleteInputComponent],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-header">
          <h2 class="modal-title">Add New Transport</h2>
          <button class="close-btn" (click)="onClose()" type="button" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="modal-body">

            <!-- Transport Type -->
            <div class="field-group">
              <label class="field-label">Transport Type</label>
              <div class="type-grid">
                @for (opt of typeOptions; track opt.value) {
                  <button
                    type="button"
                    class="type-btn"
                    [class.type-btn--active]="form.get('type')!.value === opt.value"
                    (click)="form.get('type')!.setValue(opt.value)"
                  >
                    <span class="type-icon" [innerHTML]="opt.icon"></span>
                    <span class="type-label">{{ opt.label }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- From / To -->
            <div class="form-row">
              <div class="field-group">
                <lib-location-autocomplete-input
                  label="From"
                  placeholder="Origin city"
                  formControlName="fromLocation"
                  [showError]="isInvalid('fromLocation')"
                />
                @if (isInvalid('fromLocation')) {
                  <span class="field-error">Origin is required</span>
                }
              </div>

              <div class="field-group">
                <lib-location-autocomplete-input
                  label="To"
                  placeholder="Destination city"
                  formControlName="toLocation"
                  [showError]="isInvalid('toLocation')"
                />
                @if (isInvalid('toLocation')) {
                  <span class="field-error">Destination is required</span>
                }
              </div>
            </div>

            <!-- Departure -->
            <div class="form-row">
              <div class="field-group">
                <label class="field-label" for="departureDate">Departure</label>
                <input
                  id="departureDate"
                  class="field-input"
                  [class.field-input--error]="isInvalid('departureDate')"
                  formControlName="departureDate"
                  type="date"
                  (change)="onDepartureDateChange()"
                />
                @if (isInvalid('departureDate')) {
                  <span class="field-error">Departure date is required</span>
                }
              </div>
              <div class="field-group">
                <label class="field-label" for="departureTime">&nbsp;</label>
                <input
                  id="departureTime"
                  class="field-input"
                  formControlName="departureTime"
                  type="time"
                />
              </div>
            </div>

            <!-- Arrival -->
            <div class="form-row">
              <div class="field-group">
                <label class="field-label" for="arrivalDate">Arrival</label>
                <input
                  id="arrivalDate"
                  class="field-input"
                  formControlName="arrivalDate"
                  type="date"
                  [min]="form.get('departureDate')!.value || ''"
                />
              </div>
              <div class="field-group">
                <label class="field-label" for="arrivalTime">&nbsp;</label>
                <input
                  id="arrivalTime"
                  class="field-input"
                  formControlName="arrivalTime"
                  type="time"
                />
              </div>
            </div>

            <!-- Duration hint -->
            @if (duration()) {
              <div class="duration-hint">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ duration() }}
              </div>
            }

            <!-- Price / Booking Ref -->
            <div class="form-row">
              <div class="field-group">
                <label class="field-label" for="price">Price</label>
                <div class="input-wrap">
                  <span class="input-prefix">$</span>
                  <input
                    id="price"
                    class="field-input field-input--prefix"
                    formControlName="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div class="field-group">
                <label class="field-label" for="bookingRef">Booking Ref / Notes</label>
                <input
                  id="bookingRef"
                  class="field-input"
                  formControlName="bookingRef"
                  placeholder="Flight # or PNR"
                  autocomplete="off"
                />
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="onClose()">Cancel</button>
            <button
              type="submit"
              class="btn-submit"
              [disabled]="form.invalid"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Transport
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(15,23,42,0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 200; padding: 16px;
    }

    .modal {
      background: white; border-radius: 16px;
      width: 100%; max-width: 600px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      max-height: calc(100vh - 32px);
      display: flex; flex-direction: column;
      overflow: hidden;
    }

    /* Header */
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 24px 28px 0;
    }
    .modal-title {
      margin: 0; font-size: 1.15rem; font-weight: 800;
      color: #0f172a; letter-spacing: -0.02em;
    }
    .close-btn {
      background: none; border: none; cursor: pointer; color: #94a3b8;
      padding: 6px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.12s, color 0.12s;
    }
    .close-btn:hover { background: #f1f5f9; color: #475569; }

    /* Body */
    .modal-body {
      padding: 20px 28px;
      overflow-y: auto;
      display: flex; flex-direction: column; gap: 18px;
    }

    /* Field */
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label {
      font-size: 0.78rem; font-weight: 600; color: #475569;
      text-transform: uppercase; letter-spacing: 0.04em;
    }

    .form-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
    }
    @media (max-width: 520px) {
      .form-row { grid-template-columns: 1fr; }
    }

    /* Input */
    .input-wrap { position: relative; display: flex; align-items: center; }
    .input-icon {
      position: absolute; left: 12px; color: #94a3b8; pointer-events: none;
    }
    .input-prefix {
      position: absolute; left: 12px; font-size: 0.9rem; color: #94a3b8;
      font-weight: 600; pointer-events: none;
    }

    .field-input {
      width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px;
      padding: 10px 14px; font-size: 0.875rem; color: #1e293b;
      outline: none; background: white; box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
    }
    .field-input--icon { padding-left: 36px; }
    .field-input--prefix { padding-left: 28px; }
    .field-input--error { border-color: #ef4444; }
    .field-input--error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
    .field-error { font-size: 0.75rem; color: #ef4444; }

    /* Type grid */
    .type-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
    }
    @media (max-width: 520px) {
      .type-grid { grid-template-columns: repeat(2, 1fr); }
    }

    .type-btn {
      display: flex; flex-direction: column; align-items: center;
      gap: 6px; padding: 14px 8px;
      background: #f8fafc; border: 1.5px solid #e2e8f0;
      border-radius: 12px; cursor: pointer;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
      color: #64748b;
    }
    .type-btn:hover { border-color: #93c5fd; background: #eff6ff; color: #3b82f6; }
    .type-btn--active {
      border-color: #3b82f6; background: #eff6ff; color: #3b82f6;
    }
    .type-icon { display: flex; align-items: center; justify-content: center; }
    .type-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }

    /* Duration hint */
    .duration-hint {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; color: #3b82f6; font-weight: 500;
      background: #eff6ff; border-radius: 8px; padding: 8px 12px;
    }

    /* Footer */
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 28px 24px;
      border-top: 1px solid #f1f5f9;
    }
    .btn-cancel {
      background: white; border: 1.5px solid #e2e8f0; color: #64748b;
      padding: 10px 20px; border-radius: 10px; cursor: pointer;
      font-size: 0.875rem; font-weight: 600;
      transition: background 0.12s;
    }
    .btn-cancel:hover { background: #f8fafc; }
    .btn-submit {
      display: flex; align-items: center; gap: 7px;
      background: #3b82f6; color: white; border: none;
      padding: 10px 22px; border-radius: 10px; cursor: pointer;
      font-size: 0.875rem; font-weight: 700;
      transition: background 0.15s, transform 0.15s;
    }
    .btn-submit:hover:not(:disabled) { background: #2563eb; transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 480px) {
      .modal-backdrop { align-items: flex-end; padding: 0; }
      .modal { border-radius: 20px 20px 0 0; width: 100%; max-height: 90vh; overflow-y: auto; }
      .modal-header { padding: 16px 16px 0; }
      .modal-body { padding: 16px; }
      .modal-footer { padding: 12px 16px 16px; }
    }
  `],
})
export class AddTransportModalComponent {
  readonly closed = output<void>();
  readonly submitted = output<CreateTransportPayload>();

  private readonly fb = inject(FormBuilder);

  readonly typeOptions = TYPE_OPTIONS;

  readonly form = this.fb.group({
    type: ['FLIGHT' as TransportType, Validators.required],
    fromLocation: ['', [Validators.required, Validators.minLength(1)]],
    toLocation: ['', [Validators.required, Validators.minLength(1)]],
    departureDate: ['', Validators.required],
    departureTime: [''],
    arrivalDate: [''],
    arrivalTime: [''],
    price: [null as number | null],
    bookingRef: [''],
  });

  readonly duration = computed(() => {
    const dep = this.form.get('departureDate')!.value;
    const arr = this.form.get('arrivalDate')!.value;
    const depTime = this.form.get('departureTime')!.value;
    const arrTime = this.form.get('arrivalTime')!.value;
    if (!dep || !arr) return '';
    if (dep === arr && depTime && arrTime) {
      const depMs = new Date(`${dep}T${depTime}`).getTime();
      const arrMs = new Date(`${arr}T${arrTime}`).getTime();
      const diffMin = Math.round((arrMs - depMs) / 60000);
      if (diffMin <= 0) return '';
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      return h > 0 ? `${h}h ${m > 0 ? m + 'm ' : ''}flight time` : `${m}m flight time`;
    }
    const depDate = new Date(dep);
    const arrDate = new Date(arr);
    const days = Math.round((arrDate.getTime() - depDate.getTime()) / 86400000);
    if (days === 0) return 'Same day';
    if (days === 1) return '1 day trip';
    if (days > 1) return `${days} days`;
    return '';
  });

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onDepartureDateChange(): void {
    const depDate = this.form.get('departureDate')!.value;
    const arrDate = this.form.get('arrivalDate')!.value;
    if (depDate && (!arrDate || arrDate < depDate)) {
      this.form.get('arrivalDate')!.setValue(depDate);
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const depDate = v.departureDate!;
    const arrDate = v.arrivalDate || depDate;

    const departureTime = v.departureTime
      ? new Date(`${depDate}T${v.departureTime}`).toISOString()
      : new Date(`${depDate}T00:00`).toISOString();

    const arrivalTime = v.arrivalTime
      ? new Date(`${arrDate}T${v.arrivalTime}`).toISOString()
      : new Date(`${arrDate}T00:00`).toISOString();

    const payload: CreateTransportPayload = {
      type: v.type as TransportType,
      fromLocation: v.fromLocation!,
      toLocation: v.toLocation!,
      departureTime,
      arrivalTime,
      ...(v.price != null && v.price > 0 && { price: v.price }),
    };

    this.submitted.emit(payload);
  }
}
