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
      <div class="modal" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-header">
          <h2 class="modal-title">{{ destination() ? 'Edit Destination' : 'Add Destination' }}</h2>
          <button class="close-btn" type="button" (click)="onClose()">
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
              class="btn-submit"
              [disabled]="form.invalid || !startDate() || !endDate()"
            >
              @if (destination()) {
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7L9 18l-5-5"/></svg>
                Save Changes
              } @else {
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2" fill="currentColor" stroke="none"/>
                </svg>
                Add Destination
              }
            </button>
          </div>
        </form>

      </div>
    </div>
  `,
  styles: [`
    /* Backdrop & container */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(15, 23, 42, 0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 200; padding: 16px;
    }
    .modal {
      background: white; border-radius: 16px;
      width: 100%; max-width: 580px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.22);
      max-height: calc(100vh - 32px);
      display: flex; flex-direction: column;
      overflow: hidden;
    }

    /* Header */
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 22px 28px 18px;
      border-bottom: 1px solid #f1f5f9; flex-shrink: 0;
    }
    .modal-title { margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .close-btn {
      background: none; border: none; cursor: pointer; color: #94a3b8;
      padding: 6px; border-radius: 8px; display: flex; align-items: center;
      transition: background 0.12s, color 0.12s;
    }
    .close-btn:hover { background: #f1f5f9; color: #475569; }

    /* Body */
    .modal-body {
      padding: 20px 28px;
      overflow-y: auto;
      display: flex; flex-direction: column; gap: 14px;
    }

    /* Form layout */
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }

    /* Fields */
    .field-group { display: flex; flex-direction: column; gap: 5px; }
    .field-label { font-size: 0.78rem; font-weight: 600; color: #374151; }
    .section-label { font-size: 0.88rem; font-weight: 700; color: #1e293b; margin-bottom: -2px; }

    .input-wrap { position: relative; }
    .input-icon {
      position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
      color: #94a3b8; pointer-events: none;
    }
    .field-input {
      width: 100%; box-sizing: border-box;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      padding: 10px 13px; font-size: 0.875rem; color: #1e293b;
      outline: none; background: white;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .field-input--icon { padding-left: 32px; }
    .field-input--error { border-color: #ef4444; }
    .field-error { font-size: 0.73rem; color: #ef4444; }

    /* Calendar container */
    .calendar {
      border: 1.5px solid #e8edf2; border-radius: 14px;
      background: white; overflow: hidden;
    }

    /* Month nav */
    .cal-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 13px 16px 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    .cal-month-label { font-size: 0.95rem; font-weight: 800; color: #0f172a; }
    .cal-nav-btn {
      background: none; border: none; cursor: pointer; color: #64748b;
      padding: 5px; border-radius: 7px; display: flex; align-items: center;
      transition: background 0.12s, color 0.12s;
    }
    .cal-nav-btn:hover { background: #f1f5f9; color: #0f172a; }

    /* Grid */
    .cal-grid {
      display: grid; grid-template-columns: repeat(7, 1fr);
      padding: 6px 10px 4px;
      row-gap: 1px;
    }
    .cal-dow {
      height: 30px; display: flex; align-items: center; justify-content: center;
      font-size: 0.72rem; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.04em;
    }

    /* Day cell — handles range background */
    .cal-cell {
      position: relative; height: 38px;
      display: flex; align-items: center; justify-content: center;
    }
    .cal-cell.cell-in-range::before,
    .cal-cell.cell-start::before,
    .cal-cell.cell-end::before {
      content: ''; position: absolute;
      top: 2px; bottom: 2px;
      background: #dbeafe; z-index: 0;
    }
    .cal-cell.cell-in-range::before { left: 0; right: 0; }
    .cal-cell.cell-start::before    { left: 50%; right: 0; }
    .cal-cell.cell-end::before      { left: 0; right: 50%; }

    /* Day button */
    .day-btn {
      position: relative; z-index: 1;
      width: 34px; height: 34px;
      border: none; background: none; border-radius: 50%;
      cursor: pointer; font-size: 0.875rem; font-weight: 500; color: #374151;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.1s, color 0.1s;
    }
    .day-btn:hover:not(.day-selected):not(.day-hover-sel) { background: #f1f5f9; }
    .day-btn.day-selected {
      background: #2563eb; color: white; font-weight: 700;
      box-shadow: 0 2px 8px rgba(37,99,235,0.35);
    }
    .day-btn.day-hover-sel {
      background: #93c5fd; color: white; font-weight: 700;
    }
    .day-btn.day-today:not(.day-selected):not(.day-hover-sel) {
      color: #2563eb; font-weight: 700;
    }
    .cal-cell.cell-in-range .day-btn:not(.day-selected):not(.day-hover-sel) { color: #1d4ed8; }

    /* Info bar */
    .cal-info {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 16px 12px;
      border-top: 1px solid #f1f5f9;
      font-size: 0.82rem; min-height: 38px;
    }
    .cal-sel-text { color: #374151; }
    .cal-date-hl { color: #2563eb; font-weight: 700; }
    .nights-pill {
      font-size: 0.75rem; font-weight: 600; color: #475569;
      background: #f1f5f9; padding: 3px 10px; border-radius: 20px;
    }
    .cal-hint { color: #94a3b8; font-size: 0.8rem; }

    /* Notes */
    .notes-area {
      width: 100%; box-sizing: border-box;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      padding: 11px 13px; font-size: 0.875rem; color: #1e293b;
      outline: none; resize: vertical; min-height: 78px;
      font-family: inherit; line-height: 1.5;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .notes-area:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

    /* Footer */
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 14px 28px 22px;
      border-top: 1px solid #f1f5f9; flex-shrink: 0;
    }
    .btn-cancel {
      background: white; border: 1.5px solid #e2e8f0; color: #64748b;
      padding: 10px 22px; border-radius: 10px; cursor: pointer;
      font-size: 0.875rem; font-weight: 600;
      transition: background 0.12s;
    }
    .btn-cancel:hover { background: #f8fafc; }
    .btn-submit {
      display: flex; align-items: center; gap: 7px;
      background: #2563eb; color: white; border: none;
      padding: 10px 22px; border-radius: 10px; cursor: pointer;
      font-size: 0.875rem; font-weight: 700;
      transition: background 0.15s, transform 0.15s;
    }
    .btn-submit:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 480px) {
      .modal-backdrop { align-items: flex-end; padding: 0; }
      .modal { border-radius: 20px 20px 0 0; width: 100%; max-height: 90vh; overflow-y: auto; }
      .modal-header { padding: 16px 16px 14px; }
      .modal-body { padding: 16px; }
      .modal-footer { padding: 12px 16px 16px; }
    }
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
