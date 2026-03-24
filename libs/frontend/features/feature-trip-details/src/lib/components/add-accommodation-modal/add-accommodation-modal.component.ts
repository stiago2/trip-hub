import { AfterViewInit, Component, ElementRef, HostListener, inject, input, OnInit, output, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Destination } from '@org/util-types';
import { Accommodation, CreateAccommodationPayload } from '@org/data-access-trips';
import { AccommodationsStore } from '../../store/accommodations.store';

@Component({
  selector: 'lib-add-accommodation-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-shell" (click)="$event.stopPropagation()">

        <div class="modal-header-flat">
          <div>
            <h2 class="modal-title">{{ accommodation() ? 'Edit Accommodation' : 'Add New Accommodation' }}</h2>
            <p class="modal-subtitle">{{ accommodation() ? 'Update the details for your stay.' : 'Enter the details for your stay.' }}</p>
          </div>
          <button class="modal-close-btn" type="button" (click)="onClose()">
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

          <div class="modal-footer-flat">
            <button type="button" class="btn-cancel" (click)="onClose()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || submitting()">
              @if (submitting()) {
                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              } @else if (accommodation()) {
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7L9 18l-5-5"/></svg>
              } @else {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              }
              {{ accommodation() ? 'Save Changes' : 'Add Accommodation' }}
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-shell {
      background: var(--color-surface); border-radius: var(--radius-2xl);
      padding: var(--space-7) var(--space-7) var(--space-6); width: 100%; max-width: 520px;
      max-height: 90vh; overflow-y: auto;
      box-shadow: var(--shadow-lg);
      animation: modalSlide 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .modal-header-flat {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: var(--space-6);
    }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .optional-label { font-weight: 400; color: var(--color-text-placeholder); margin-left: 4px; }
    .input-icon-wrapper { position: relative; }
    .input-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      color: var(--color-text-placeholder); pointer-events: none;
    }
    .input-prefix {
      position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
      font-size: var(--font-size-base); color: var(--color-text-muted); pointer-events: none;
    }
    .field-input--icon { padding-left: 36px; }
    .field-input--prefix { padding-left: 26px; }
    .select-wrapper { position: relative; }
    .field-select {
      width: 100%; border: 1.5px solid var(--color-border); border-radius: var(--radius-lg);
      padding: 10px 36px 10px 14px; font-size: var(--font-size-base); color: var(--color-text);
      outline: none; appearance: none; background: var(--color-surface); cursor: pointer;
      transition: border-color 150ms; box-sizing: border-box;
    }
    .field-select:focus { border-color: var(--color-border-focus); }
    .field-select.error { border-color: var(--color-danger); }
    .select-chevron {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      pointer-events: none; color: var(--color-text-muted);
    }
    .modal-footer-flat { display: flex; gap: var(--space-3); margin-top: var(--space-7); }
    .btn-primary { flex: 1; justify-content: center; }
    @media (max-width: 480px) {
      .modal-shell { border-radius: 20px 20px 0 0; width: 100%; padding: var(--space-5) var(--space-4); }
      .modal-footer-flat { margin-top: var(--space-4); }
    }
  `],
})
export class AddAccommodationModalComponent implements AfterViewInit, OnInit {
  private readonly fb    = inject(FormBuilder);
  private readonly store = inject(AccommodationsStore);

  readonly destinations  = input<Destination[]>([]);
  readonly accommodation = input<Accommodation | null>(null);
  readonly closed        = output<void>();
  readonly submitting    = signal(false);

  @ViewChild('nameInput') private readonly nameInputRef!: ElementRef<HTMLInputElement>;

  readonly form = this.fb.group({
    name:          ['', Validators.required],
    destinationId: ['', Validators.required],
    checkIn:       ['', Validators.required],
    checkOut:      ['', Validators.required],
    address:       [''],
    price:         [null as number | null],
  });

  ngOnInit(): void {
    const acc = this.accommodation();
    if (!acc) return;
    this.form.patchValue({
      name:          acc.name,
      destinationId: acc.destinationId,
      checkIn:       acc.checkIn.slice(0, 10),
      checkOut:      acc.checkOut.slice(0, 10),
      address:       acc.address ?? '',
      price:         acc.price,
    });
  }

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
    const checkIn  = this.form.get('checkIn')!.value;
    const checkOut = this.form.get('checkOut')!.value;
    if (checkIn && checkOut && checkOut < checkIn) {
      this.form.patchValue({ checkOut: checkIn });
    }
  }

  onClose(): void { this.closed.emit(); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v   = this.form.value;
    const acc = this.accommodation();

    const payload: CreateAccommodationPayload = {
      name:     v.name!.trim(),
      checkIn:  v.checkIn!,
      checkOut: v.checkOut!,
      ...(v.address?.trim() ? { address: v.address.trim() } : {}),
      ...(v.price != null   ? { price: Number(v.price) }    : {}),
    };

    this.submitting.set(true);
    if (acc) {
      this.store.updateAccommodation(acc.id, payload, () => this.closed.emit(), () => this.submitting.set(false));
    } else {
      this.store.createAccommodation(v.destinationId!, payload, () => this.closed.emit(), () => this.submitting.set(false));
    }
  }
}
