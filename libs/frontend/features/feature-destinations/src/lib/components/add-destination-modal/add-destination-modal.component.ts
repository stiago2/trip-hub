import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Destination } from '@org/util-types';
import { DestinationsStore } from '../../store/destinations.store';
import { LocationAutocompleteInputComponent, LocationResult } from '@org/ui-components';


const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface CalDay { day: number | null; date: Date | null; }

@Component({
  selector: 'lib-add-destination-modal',
  standalone: true,
  imports: [ReactiveFormsModule, LocationAutocompleteInputComponent],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-container dest-modal" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-header">
          <h2 class="modal-title">{{ destination() ? 'Edit Destination' : 'Add Destination' }}</h2>
          <button class="modal-close-btn" type="button" (click)="onClose()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="modal-body">

            <!-- City / Country -->
            <div class="form-row">
              <div class="field-group">
                <lib-location-autocomplete-input
                  label="City"
                  placeholder="Search city..."
                  formControlName="city"
                  [showError]="isInvalid('city')"
                  (locationSelected)="onCitySelected($event)"
                />
                @if (isInvalid('city')) {
                  <span class="field-error">City is required</span>
                }
              </div>

              <div class="field-group">
                <label class="field-label" for="country">Country</label>
                <div class="input-wrap">
                  <svg class="input-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <input
                    id="country" class="field-input field-input--icon" formControlName="country"
                    [class.field-input--error]="isInvalid('country')"
                    placeholder="e.g. France" autocomplete="off"
                  />
                </div>
                @if (isInvalid('country')) {
                  <span class="field-error">Country is required</span>
                }
              </div>
            </div>

            <!-- Travel Dates -->
            <div class="section-label">Travel Dates</div>

            <div class="calendar">
              <!-- Month navigation -->
              <div class="cal-nav">
                <button type="button" class="cal-nav-btn" (click)="prevMonth()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <span class="cal-month-label">{{ monthLabel() }}</span>
                <button type="button" class="cal-nav-btn" (click)="nextMonth()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>

              <!-- Calendar grid -->
              <div class="cal-grid">
                <!-- Day-of-week headers -->
                @for (d of dow; track $index) {
                  <div class="cal-dow">{{ d }}</div>
                }

                <!-- Day cells -->
                @for (d of calDays(); track $index) {
                  @if (d.date) {
                    <div
                      class="cal-cell"
                      [class.cell-start]="isStart(d.date) && hasRange()"
                      [class.cell-end]="(isEnd(d.date) || isHoverEnd(d.date)) && hasRange()"
                      [class.cell-in-range]="isInRange(d.date)"
                    >
                      <button
                        type="button"
                        class="day-btn"
                        [class.day-selected]="isStart(d.date) || isEnd(d.date)"
                        [class.day-hover-sel]="isHoverEnd(d.date)"
                        [class.day-today]="isToday(d.date)"
                        (click)="onDayClick(d.date)"
                        (mouseenter)="hoverDate.set(d.date)"
                        (mouseleave)="hoverDate.set(null)"
                      >{{ d.day }}</button>
                    </div>
                  } @else {
                    <div class="cal-cell"></div>
                  }
                }
              </div>

              <!-- Selected range info bar -->
              <div class="cal-info">
                @if (startDate()) {
                  <span class="cal-sel-text">
                    Selected:
                    <span class="cal-date-hl">{{ fmtShort(startDate()) }}</span>
                    @if (endDate()) {
                      to <span class="cal-date-hl">{{ fmtShort(endDate()) }}</span>
                    }
                  </span>
                  @if (nights() !== null) {
                    <span class="nights-pill">{{ nights() }} night{{ nights() !== 1 ? 's' : '' }}</span>
                  }
                } @else {
                  <span class="cal-hint">Select arrival date, then departure.</span>
                }
              </div>
            </div>

            @if (dateError()) {
              <span class="field-error">Please select both arrival and departure dates.</span>
            }

            <!-- Notes -->
            <div class="section-label">Notes & Description</div>
            <textarea
              class="notes-area"
              formControlName="notes"
              placeholder="Add some details about why you're going here or what you want to see..."
              rows="3"
            ></textarea>

          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="onClose()">Cancel</button>
            <button
              type="submit"
              class="btn-primary"
              [disabled]="form.invalid || !startDate() || !endDate() || submitting()"
            >
              @if (submitting()) {
                <svg class="spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              } @else if (destination()) {
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7L9 18l-5-5"/></svg>
              } @else {
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2" fill="currentColor" stroke="none"/>
                </svg>
              }
              {{ destination() ? 'Save Changes' : 'Add Destination' }}
            </button>
          </div>
        </form>

      </div>
    </div>
  `,
  styles: [`
    /* Override max-width for destination modal (wider for calendar) */
    .dest-modal { max-width: 580px; }

    /* Form layout */
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3-5); }
    @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }

    .field-group { display: flex; flex-direction: column; gap: 5px; }
    .section-label { font-size: 0.88rem; font-weight: var(--font-weight-bold); color: var(--color-text); margin-bottom: -2px; }

    .input-wrap { position: relative; }
    .input-icon {
      position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
      color: var(--color-text-placeholder); pointer-events: none;
    }
    .field-input--icon { padding-left: 32px; }

    /* Calendar */
    .calendar {
      border: 1.5px solid var(--color-border); border-radius: 14px;
      background: var(--color-surface); overflow: hidden;
    }
    .cal-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 13px var(--space-4) 10px; border-bottom: 1px solid var(--color-surface-muted);
    }
    .cal-month-label { font-size: var(--font-size-md); font-weight: var(--font-weight-extrabold); color: var(--color-text); }
    .cal-nav-btn {
      background: none; border: none; cursor: pointer; color: #64748b;
      padding: 5px; border-radius: var(--radius-xs); display: flex; align-items: center;
      transition: background var(--transition-fast), color var(--transition-fast);
    }
    .cal-nav-btn:hover { background: var(--color-surface-muted); color: var(--color-text); }
    .cal-grid {
      display: grid; grid-template-columns: repeat(7, 1fr);
      padding: 6px 10px 4px; row-gap: 1px;
    }
    .cal-dow {
      height: 30px; display: flex; align-items: center; justify-content: center;
      font-size: 0.72rem; font-weight: var(--font-weight-bold); color: var(--color-text-placeholder);
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .cal-cell {
      position: relative; height: 38px;
      display: flex; align-items: center; justify-content: center;
    }
    .cal-cell.cell-in-range::before,
    .cal-cell.cell-start::before,
    .cal-cell.cell-end::before {
      content: ''; position: absolute; top: 2px; bottom: 2px; background: #dbeafe; z-index: 0;
    }
    .cal-cell.cell-in-range::before { left: 0; right: 0; }
    .cal-cell.cell-start::before    { left: 50%; right: 0; }
    .cal-cell.cell-end::before      { left: 0; right: 50%; }
    .day-btn {
      position: relative; z-index: 1; width: 34px; height: 34px;
      border: none; background: none; border-radius: 50%;
      cursor: pointer; font-size: var(--font-size-body); font-weight: var(--font-weight-medium); color: var(--color-text-secondary);
      display: flex; align-items: center; justify-content: center;
      transition: background 0.1s, color 0.1s;
    }
    .day-btn:hover:not(.day-selected):not(.day-hover-sel) { background: var(--color-surface-muted); }
    .day-btn.day-selected {
      background: var(--color-primary); color: white; font-weight: var(--font-weight-bold);
      box-shadow: 0 2px 8px rgba(37,99,235,0.35);
    }
    .day-btn.day-hover-sel { background: #93c5fd; color: white; font-weight: var(--font-weight-bold); }
    .day-btn.day-today:not(.day-selected):not(.day-hover-sel) { color: var(--color-primary); font-weight: var(--font-weight-bold); }
    .cal-cell.cell-in-range .day-btn:not(.day-selected):not(.day-hover-sel) { color: var(--color-primary-hover); }
    .cal-info {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-2) var(--space-4) var(--space-3); border-top: 1px solid var(--color-surface-muted);
      font-size: var(--font-size-sm); min-height: 38px;
    }
    .cal-sel-text { color: var(--color-text-secondary); }
    .cal-date-hl { color: var(--color-primary); font-weight: var(--font-weight-bold); }
    .nights-pill {
      font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: #475569;
      background: var(--color-surface-muted); padding: 3px 10px; border-radius: var(--radius-3xl);
    }
    .cal-hint { color: var(--color-text-placeholder); font-size: 0.8rem; }

    /* Notes */
    .notes-area {
      width: 100%; box-sizing: border-box;
      border: 1.5px solid var(--color-border); border-radius: var(--radius-lg);
      padding: 11px 13px; font-size: var(--font-size-body); color: var(--color-text);
      outline: none; resize: vertical; min-height: 78px;
      font-family: inherit; line-height: var(--leading-relaxed);
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .notes-area:focus { border-color: var(--color-border-focus); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  `],
})
export class AddDestinationModalComponent implements OnInit {
  private readonly store = inject(DestinationsStore);
  private readonly fb = inject(FormBuilder);

  readonly closed = output<void>();
  readonly destination = input<Destination | null>(null);

  // Calendar state
  private readonly today = new Date();
  readonly dow = DOW;
  readonly calYear = signal(this.today.getFullYear());
  readonly calMonth = signal(this.today.getMonth());
  readonly startDate = signal<Date | null>(null);
  readonly endDate = signal<Date | null>(null);
  readonly hoverDate = signal<Date | null>(null);
  readonly dateError = signal(false);
  readonly submitting = signal(false);

  // Form
  readonly form = this.fb.group({
    city:    ['', Validators.required],
    country: ['', Validators.required],
    notes:   [''],
  });

  ngOnInit(): void {
    const dest = this.destination();
    if (!dest) return;
    this.form.patchValue({ city: dest.city, country: dest.country, notes: dest.notes ?? '' });
    const start = new Date(dest.startDate.slice(0, 10) + 'T00:00:00');
    const end = new Date(dest.endDate.slice(0, 10) + 'T00:00:00');
    this.startDate.set(start);
    this.endDate.set(end);
    this.calYear.set(start.getFullYear());
    this.calMonth.set(start.getMonth());
  }

  // ── Computed ──────────────────────────────────────────────────

  readonly calDays = computed<CalDay[]>(() => {
    const y = this.calYear(), m = this.calMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const total    = new Date(y, m + 1, 0).getDate();
    const days: CalDay[] = [];
    for (let i = 0; i < firstDow; i++) days.push({ day: null, date: null });
    for (let d = 1; d <= total; d++) days.push({ day: d, date: new Date(y, m, d) });
    return days;
  });

  readonly monthLabel = computed(() =>
    new Date(this.calYear(), this.calMonth())
      .toLocaleString('en-US', { month: 'long', year: 'numeric' })
  );

  readonly nights = computed<number | null>(() => {
    const s = this.startDate(), e = this.endDate();
    if (!s || !e) return null;
    const n = Math.round((e.getTime() - s.getTime()) / 86400000);
    return n >= 0 ? Math.max(n, 1) : null;
  });

  readonly hasRange = computed(() => {
    const s = this.startDate();
    if (!s) return false;
    const e = this.endDate() ?? (
      this.hoverDate() && this.hoverDate()! > s ? this.hoverDate() : null
    );
    return !!(e && !this.sameDay(s, e));
  });

  // ── Calendar helpers ──────────────────────────────────────────

  prevMonth(): void {
    let m = this.calMonth() - 1, y = this.calYear();
    if (m < 0) { m = 11; y--; }
    this.calMonth.set(m); this.calYear.set(y);
  }

  nextMonth(): void {
    let m = this.calMonth() + 1, y = this.calYear();
    if (m > 11) { m = 0; y++; }
    this.calMonth.set(m); this.calYear.set(y);
  }

  onDayClick(date: Date): void {
    const s = this.startDate(), e = this.endDate();
    if (!s || (s && e)) {
      // Start fresh selection
      this.startDate.set(date);
      this.endDate.set(null);
    } else {
      // Complete range
      if (date >= s) {
        this.endDate.set(date);
      } else {
        // Clicked before start — shift the window
        this.startDate.set(date);
        this.endDate.set(null);
      }
    }
    this.dateError.set(false);
  }

  isStart(d: Date): boolean { const s = this.startDate(); return !!s && this.sameDay(d, s); }
  isEnd(d: Date): boolean   { const e = this.endDate();   return !!e && this.sameDay(d, e); }
  isToday(d: Date): boolean { return this.sameDay(d, this.today); }

  isHoverEnd(d: Date): boolean {
    if (this.endDate() || !this.startDate()) return false;
    const h = this.hoverDate();
    return !!(h && h > this.startDate()! && this.sameDay(d, h));
  }

  isInRange(d: Date): boolean {
    const s = this.startDate();
    if (!s) return false;
    const e = this.endDate()
      ?? (this.hoverDate() && this.hoverDate()! > s ? this.hoverDate() : null);
    return !!(e && d > s && d < e);
  }

  fmtShort(d: Date | null): string {
    return d ? d.toLocaleString('en-US', { month: 'short', day: 'numeric' }) : '';
  }

  // ── Form validation ───────────────────────────────────────────

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  // ── Submit / Close ────────────────────────────────────────────

  onCitySelected(result: LocationResult): void {
    this.form.patchValue({ country: result.country });
  }

  onClose(): void { this.closed.emit(); }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (!this.startDate() || !this.endDate()) {
      this.dateError.set(true);
      return;
    }
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const dest = this.destination();
    this.submitting.set(true);
    if (dest) {
      this.store.updateDestination(
        dest.id,
        {
          city: v.city!,
          country: v.country!,
          startDate: this.toISO(this.startDate()!),
          endDate:   this.toISO(this.endDate()!),
          notes: v.notes || undefined,
        },
        () => this.closed.emit(),
        () => this.submitting.set(false),
      );
    } else {
      this.store.createDestination(
        {
          city: v.city!,
          country: v.country!,
          startDate: this.toISO(this.startDate()!),
          endDate:   this.toISO(this.endDate()!),
          notes: v.notes || undefined,
        },
        () => this.closed.emit(),
        () => this.submitting.set(false),
      );
    }
  }

  // ── Utilities ─────────────────────────────────────────────────

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private toISO(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
}
