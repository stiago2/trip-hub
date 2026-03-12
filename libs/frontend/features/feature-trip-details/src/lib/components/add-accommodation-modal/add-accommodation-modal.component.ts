import { AfterViewInit, Component, ElementRef, HostListener, inject, input, output, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Destination } from '@org/util-types';
import { CreateAccommodationPayload } from '@org/data-access-trips';

@Component({
  selector: 'lib-add-accommodation-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="backdrop" (click)="onClose()">
      <div class="modal" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <div>
            <h2 class="modal-title">Add New Accommodation</h2>
            <p class="modal-subtitle">Enter the details for your stay.</p>
          </div>
          <button class="close-btn" type="button" (click)="onClose()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- Hotel Name -->
          <div class="field">
            <label class="field-label" for="name">Hotel / Stay Name</label>
            <input
              #nameInput
              id="name"
              class="field-input"
              [class.error]="isInvalid('name')"
              formControlName="name"
              placeholder="e.g. Grand Hyatt Tokyo"
              autocomplete="off"
            />
            @if (isInvalid('name')) {
              <span class="field-error">Accommodation name is required</span>
            }
          </div>

          <!-- Destination -->
          <div class="field">
            <label class="field-label" for="destinationId">Destination</label>
            <div class="select-wrapper">
              <select
                id="destinationId"
                class="field-select"
                [class.error]="isInvalid('destinationId')"
                formControlName="destinationId"
              >
                <option value="">Select a destination…</option>
                @for (d of destinations(); track d.id) {
                  <option [value]="d.id">{{ d.city }}, {{ d.country }}</option>
                }
              </select>
              <svg class="select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            @if (isInvalid('destinationId')) {
              <span class="field-error">Please select a destination</span>
            }
          </div>

          <!-- Check-in / Check-out row -->
          <div class="field-row">
            <div class="field">
              <label class="field-label" for="checkIn">Check-in Date</label>
              <input
                id="checkIn"
                class="field-input"
                [class.error]="isInvalid('checkIn')"
                formControlName="checkIn"
                type="date"
                (change)="onCheckInChange()"
              />
              @if (isInvalid('checkIn')) {
                <span class="field-error">Check-in date is required</span>
              }
            </div>

            <div class="field">
              <label class="field-label" for="checkOut">Check-out Date</label>
              <input
                id="checkOut"
                class="field-input"
                [class.error]="isInvalid('checkOut')"
                formControlName="checkOut"
                type="date"
                [min]="form.get('checkIn')!.value ?? ''"
              />
              @if (isInvalid('checkOut')) {
                <span class="field-error">Check-out date is required</span>
              }
            </div>
          </div>

          <!-- Address (optional) -->
          <div class="field">
            <label class="field-label" for="address">
              Address
              <span class="optional-label">(Optional)</span>
            </label>
            <div class="input-icon-wrapper">
              <svg class="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <input
                id="address"
                class="field-input field-input--icon"
                formControlName="address"
                placeholder="Enter street address"
                autocomplete="off"
              />
            </div>
          </div>

          <!-- Price (optional) -->
          <div class="field">
            <label class="field-label" for="price">
              Total Price
              <span class="optional-label">(Optional)</span>
            </label>
            <div class="input-icon-wrapper">
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

          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="onClose()">Cancel</button>
            <button type="submit" class="btn-submit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Accommodation
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    @keyframes backdropFade {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes modalSlide {
      from { opacity: 0; transform: translateY(16px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .backdrop {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 200;
      animation: backdropFade 180ms ease;
      padding: 20px;
    }

    .modal {
      background: #fff;
      border-radius: 16px;
      padding: 28px 28px 24px;
      width: 100%; max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
      animation: modalSlide 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .modal-title {
      margin: 0 0 4px;
      font-size: 1.15rem;
      font-weight: 700;
      color: #111827;
    }

    .modal-subtitle {
      margin: 0;
      font-size: 0.82rem;
      color: #6b7280;
    }

    .close-btn {
      background: none; border: none;
      color: #9ca3af; cursor: pointer;
      padding: 4px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      transition: color 150ms, background 150ms;
      flex-shrink: 0;
    }
    .close-btn:hover { color: #374151; background: #f3f4f6; }

    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .field-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #374151;
      letter-spacing: 0.01em;
    }

    .optional-label {
      font-weight: 400;
      color: #9ca3af;
      margin-left: 4px;
    }

    .field-input {
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 0.92rem;
      color: #111827;
      outline: none;
      transition: border-color 150ms;
      background: #fff;
      width: 100%;
      box-sizing: border-box;
    }
    .field-input::placeholder { color: #9ca3af; }
    .field-input:focus { border-color: #4f46e5; }
    .field-input.error { border-color: #ef4444; }

    .field-error { font-size: 0.78rem; color: #ef4444; }

    .input-icon-wrapper { position: relative; }
    .input-icon {
      position: absolute;
      left: 12px; top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      pointer-events: none;
    }
    .input-prefix {
      position: absolute;
      left: 13px; top: 50%;
      transform: translateY(-50%);
      font-size: 0.9rem;
      color: #6b7280;
      pointer-events: none;
    }
    .field-input--icon { padding-left: 36px; }
    .field-input--prefix { padding-left: 26px; }

    .select-wrapper { position: relative; }
    .field-select {
      width: 100%;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      padding: 10px 36px 10px 14px;
      font-size: 0.92rem;
      color: #111827;
      outline: none;
      appearance: none;
      background: #fff;
      cursor: pointer;
      transition: border-color 150ms;
      box-sizing: border-box;
    }
    .field-select:focus { border-color: #4f46e5; }
    .field-select.error { border-color: #ef4444; }

    .select-chevron {
      position: absolute;
      right: 12px; top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: #6b7280;
    }

    .modal-footer {
      display: flex;
      gap: 10px;
      margin-top: 28px;
    }

    .btn-cancel {
      flex: 0 0 auto;
      padding: 10px 18px;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      background: none;
      font-size: 0.9rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: background 150ms, border-color 150ms;
    }
    .btn-cancel:hover { background: #f9fafb; border-color: #d1d5db; }

    .btn-submit {
      flex: 1;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px 18px;
      border: none;
      border-radius: 10px;
      background: #2563eb;
      color: #fff;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms;
    }
    .btn-submit:hover { background: #1d4ed8; }
  `],
})
export class AddAccommodationModalComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);

  readonly destinations = input<Destination[]>([]);
  readonly closed = output<void>();
  readonly submitted = output<{ destinationId: string; payload: CreateAccommodationPayload }>();

  @ViewChild('nameInput') private readonly nameInputRef!: ElementRef<HTMLInputElement>;

  readonly form = this.fb.group({
    name:          ['', Validators.required],
    destinationId: ['', Validators.required],
    checkIn:       ['', Validators.required],
    checkOut:      ['', Validators.required],
    address:       [''],
    price:         [null as number | null],
  });

  ngAfterViewInit(): void {
    setTimeout(() => this.nameInputRef?.nativeElement?.focus(), 60);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closed.emit(); }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onCheckInChange(): void {
    const checkIn = this.form.get('checkIn')!.value;
    const checkOut = this.form.get('checkOut')!.value;
    if (checkIn && checkOut && checkOut < checkIn) {
      this.form.patchValue({ checkOut: checkIn });
    }
  }

  onClose(): void { this.closed.emit(); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    this.submitted.emit({
      destinationId: v.destinationId!,
      payload: {
        name:     v.name!.trim(),
        checkIn:  v.checkIn!,
        checkOut: v.checkOut!,
        ...(v.address?.trim() ? { address: v.address.trim() } : {}),
        ...(v.price != null ? { price: Number(v.price) } : {}),
      },
    });
  }
}
