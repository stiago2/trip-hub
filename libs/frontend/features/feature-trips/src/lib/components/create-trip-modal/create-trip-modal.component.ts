import { AfterViewInit, Component, ElementRef, HostListener, inject, input, OnInit, output, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Trip } from '@org/util-types';
import { TripsStore } from '../../store/trips.store';

@Component({
  selector: 'lib-create-trip-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-shell" (click)="$event.stopPropagation()">

        <div class="modal-header-flat">
          <div>
            <h2 class="modal-title">{{ trip() ? 'Edit Trip' : 'Create New Trip' }}</h2>
            <p class="modal-subtitle">{{ trip() ? 'Update your trip details.' : 'Plan your next adventure with friends.' }}</p>
          </div>
          <button class="modal-close-btn" type="button" (click)="onClose()">
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

          <div class="modal-footer-flat">
            <button type="button" class="btn-cancel" (click)="onClose()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || submitting()">
              @if (submitting()) {
                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              } @else if (trip()) {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              } @else {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              }
              {{ trip() ? 'Save Changes' : 'Create Trip' }}
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-shell {
      background: var(--color-surface);
      border-radius: var(--radius-2xl);
      padding: 28px 28px 24px;
      width: 100%; max-width: 500px;
      max-height: 90vh; overflow-y: auto;
      box-shadow: var(--shadow-lg);
      animation: modalSlide 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .modal-header-flat {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 24px;
    }

    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    .optional-tag {
      font-weight: 400; color: var(--color-text-placeholder);
      font-size: var(--font-size-xs); margin-left: 3px;
    }

    .field-textarea {
      border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
      padding: 9px 12px; font-size: var(--font-size-base); color: var(--color-text);
      outline: none; transition: border-color 150ms; background: var(--color-surface);
      width: 100%; box-sizing: border-box; resize: vertical;
      font-family: inherit; line-height: 1.5; min-height: 72px;
    }
    .field-textarea::placeholder { color: var(--color-text-placeholder); }
    .field-textarea:focus { border-color: var(--color-border-focus); }

    .modal-footer-flat {
      display: flex; align-items: center; justify-content: flex-end;
      gap: var(--space-3); margin-top: 24px;
    }

    @media (max-width: 480px) {
      .modal-shell { border-radius: 20px 20px 0 0; width: 100%; padding: 20px 16px; }
      .modal-footer-flat { margin-top: 16px; }
    }
  `],
})
export class CreateTripModalComponent implements OnInit, AfterViewInit {
  private readonly store = inject(TripsStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly trip = input<Trip | null>(null);
  readonly closed = output<void>();
  readonly submitting = signal(false);

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

    this.submitting.set(true);
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
        () => this.submitting.set(false),
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
        () => this.submitting.set(false),
      );
    }
  }
}
