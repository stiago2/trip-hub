import { AfterViewInit, Component, ElementRef, HostListener, inject, input, OnInit, output, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Trip } from '@org/util-types';
import { TripsStore } from '../../store/trips.store';

@Component({
  selector: 'lib-create-trip-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="backdrop" (click)="onClose()">
      <div class="modal" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <div>
            <h2 class="modal-title">{{ trip() ? 'Edit Trip' : 'Create New Trip' }}</h2>
            <p class="modal-subtitle">{{ trip() ? 'Update your trip details.' : 'Plan your next adventure with friends.' }}</p>
          </div>
          <button class="close-btn" type="button" (click)="onClose()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- Trip Name -->
          <div class="field">
            <label class="field-label" for="title">Trip Name</label>
            <input
              #titleInput
              id="title"
              class="field-input"
              [class.error]="isInvalid('title')"
              formControlName="title"
              placeholder="e.g. European Summer Tour"
              autocomplete="off"
            />
            @if (isInvalid('title')) {
              <span class="field-error">Trip name is required</span>
            }
          </div>

          <!-- Start Date + End Date -->
          <div class="field-row">
            <div class="field">
              <label class="field-label" for="startDate">Start Date</label>
              <input
                id="startDate"
                class="field-input"
                [class.error]="isInvalid('startDate')"
                formControlName="startDate"
                type="date"
                (change)="onStartDateChange()"
              />
              @if (isInvalid('startDate')) {
                <span class="field-error">Start date is required</span>
              }
            </div>

            <div class="field">
              <label class="field-label" for="endDate">End Date</label>
              <input
                id="endDate"
                class="field-input"
                [class.error]="isInvalid('endDate')"
                formControlName="endDate"
                type="date"
                [min]="form.value.startDate || ''"
              />
              @if (isInvalid('endDate')) {
                <span class="field-error">End date is required</span>
              }
            </div>
          </div>

          <!-- Description & Notes -->
          <div class="field">
            <label class="field-label" for="description">
              Description & Notes
              <span class="optional-tag">(Optional)</span>
            </label>
            <textarea
              id="description"
              class="field-textarea"
              formControlName="description"
              rows="3"
              placeholder="Add some details or an itinerary summary..."
            ></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="onClose()">Cancel</button>
            <button type="submit" class="btn-submit">
              @if (trip()) {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Changes
              } @else {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create Trip
              }
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
      background: rgba(0, 0, 0, 0.4);
      display: flex; align-items: center; justify-content: center;
      z-index: 200;
      animation: backdropFade 180ms ease;
    }

    .modal {
      background: #fff;
      border-radius: 16px;
      padding: 28px 28px 24px;
      width: 100%; max-width: 500px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      animation: modalSlide 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .modal-title {
      margin: 0 0 3px;
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
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

    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    .field-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #374151;
    }

    .optional-tag {
      font-weight: 400;
      color: #9ca3af;
      font-size: 0.78rem;
      margin-left: 3px;
    }

    .field-input {
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 0.9rem;
      color: #111827;
      outline: none;
      transition: border-color 150ms;
      background: #fff;
      width: 100%;
      box-sizing: border-box;
    }
    .field-input::placeholder { color: #9ca3af; }
    .field-input:focus { border-color: #2563eb; }
    .field-input.error { border-color: #ef4444; }

    .field-error { font-size: 0.75rem; color: #ef4444; }

    .field-textarea {
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 0.9rem;
      color: #111827;
      outline: none;
      transition: border-color 150ms;
      background: #fff;
      width: 100%;
      box-sizing: border-box;
      resize: vertical;
      font-family: inherit;
      line-height: 1.5;
      min-height: 72px;
    }
    .field-textarea::placeholder { color: #9ca3af; }
    .field-textarea:focus { border-color: #2563eb; }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    .btn-cancel {
      background: none; border: none;
      padding: 10px 16px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      border-radius: 8px;
      transition: background 150ms;
    }
    .btn-cancel:hover { background: #f3f4f6; }

    @media (max-width: 480px) {
      .backdrop { align-items: flex-end; padding: 0; }
      .modal { border-radius: 20px 20px 0 0; width: 100%; max-height: 90vh; overflow-y: auto; padding: 20px 16px; }
      .modal-footer { margin-top: 16px; }
    }

    .btn-submit {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 22px;
      border: none;
      border-radius: 8px;
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
export class CreateTripModalComponent implements OnInit, AfterViewInit {
  private readonly store = inject(TripsStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly trip = input<Trip | null>(null);
  readonly closed = output<void>();

  @ViewChild('titleInput') private readonly titleInputRef!: ElementRef<HTMLInputElement>;

  readonly form = this.fb.group({
    title:       ['', Validators.required],
    startDate:   ['', Validators.required],
    endDate:     ['', Validators.required],
    description: [''],
  });

  ngOnInit(): void {
    const t = this.trip();
    if (t) {
      this.form.patchValue({
        title:       t.title,
        startDate:   t.startDate.slice(0, 10),
        endDate:     t.endDate.slice(0, 10),
        description: t.description ?? '',
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.titleInputRef?.nativeElement?.focus(), 60);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closed.emit(); }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onStartDateChange(): void {
    const { startDate, endDate } = this.form.value;
    if (startDate && endDate && endDate < startDate) {
      this.form.patchValue({ endDate: startDate });
    }
  }

  onClose(): void { this.closed.emit(); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { title, startDate, endDate, description } = this.form.value;
    const t = this.trip();

    if (t) {
      this.store.updateTrip(
        t.id,
        {
          title: title!.trim(),
          startDate: startDate!,
          endDate: endDate!,
          description: description || undefined,
        },
        () => this.closed.emit(),
      );
    } else {
      this.store.createTrip(
        {
          title: title!.trim(),
          startDate: startDate!,
          endDate: endDate!,
          description: description || undefined,
        },
        (trip) => {
          this.closed.emit();
          this.router.navigate(['/trips', trip.id, 'dashboard']);
        },
      );
    }
  }
}
