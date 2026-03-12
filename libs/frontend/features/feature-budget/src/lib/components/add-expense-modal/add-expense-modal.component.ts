import { AfterViewInit, Component, computed, ElementRef, HostListener, inject, output, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BudgetStore } from '../../store/budget.store';
import { TripMembersStore } from '@org/feature-trip-members';
import { AuthStore } from '@org/feature-auth';

const CATEGORIES = [
  { value: 'FOOD',          label: 'Food & Dining' },
  { value: 'TRANSPORT',     label: 'Transport' },
  { value: 'ACCOMMODATION', label: 'Accommodation' },
  { value: 'ACTIVITY',      label: 'Activities' },
  { value: 'OTHER',         label: 'Miscellaneous' },
];

@Component({
  selector: 'lib-add-expense-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="backdrop" (click)="onClose()">
      <div class="modal" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <div>
            <h2 class="modal-title">Add New Expense</h2>
            <p class="modal-subtitle">Track your spending for this trip</p>
          </div>
          <button class="close-btn" type="button" (click)="onClose()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <!-- Expense Name -->
          <div class="field">
            <label class="field-label" for="title">Expense Name</label>
            <input
              #titleInput
              id="title"
              class="field-input"
              [class.error]="isInvalid('title')"
              formControlName="title"
              placeholder="e.g. Sushi Dinner in Tokyo"
              autocomplete="off"
            />
            @if (isInvalid('title')) {
              <span class="field-error">Expense name is required</span>
            }
          </div>

          <!-- Amount + Date -->
          <div class="field-row">
            <div class="field">
              <label class="field-label" for="amount">Amount</label>
              <div class="amount-wrapper">
                <span class="amount-prefix">$</span>
                <input
                  id="amount"
                  class="field-input field-input--amount"
                  [class.error]="isInvalid('amount')"
                  formControlName="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              @if (isInvalid('amount')) {
                <span class="field-error">Enter a valid amount</span>
              }
            </div>

            <div class="field">
              <label class="field-label" for="date">Date</label>
              <input
                id="date"
                class="field-input"
                [class.error]="isInvalid('date')"
                formControlName="date"
                type="date"
              />
              @if (isInvalid('date')) {
                <span class="field-error">Date is required</span>
              }
            </div>
          </div>

          <!-- Category + Paid By -->
          <div class="field-row">
            <div class="field">
              <label class="field-label" for="category">Category</label>
              <div class="select-wrapper">
                <select id="category" class="field-select" formControlName="category">
                  <option value="" disabled>Select category</option>
                  @for (cat of categories; track cat.value) {
                    <option [value]="cat.value">{{ cat.label }}</option>
                  }
                </select>
                <svg class="select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            <div class="field">
              <label class="field-label" for="paidBy">Paid By</label>
              <div class="select-wrapper">
                <select id="paidBy" class="field-select" formControlName="paidByUserId">
                  <option value="">Select member</option>
                  @for (option of paidByOptions(); track option.userId) {
                    <option [value]="option.userId">{{ option.label }}</option>
                  }
                </select>
                <svg class="select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="onClose()">Cancel</button>
            <button type="submit" class="btn-submit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Expense
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

    .amount-wrapper { position: relative; }
    .amount-prefix {
      position: absolute;
      left: 12px; top: 50%;
      transform: translateY(-50%);
      font-size: 0.9rem;
      font-weight: 600;
      color: #6b7280;
      pointer-events: none;
    }
    .field-input--amount { padding-left: 26px; }

    .select-wrapper { position: relative; }
    .field-select {
      width: 100%;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      padding: 9px 34px 9px 12px;
      font-size: 0.9rem;
      color: #111827;
      outline: none;
      appearance: none;
      background: #fff;
      cursor: pointer;
      transition: border-color 150ms;
      box-sizing: border-box;
    }
    .field-select:focus { border-color: #2563eb; }
    .field-select option[value=""][disabled] { color: #9ca3af; }

    .select-chevron {
      position: absolute;
      right: 10px; top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: #6b7280;
    }

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
export class AddExpenseModalComponent implements AfterViewInit {
  private readonly store = inject(BudgetStore);
  private readonly membersStore = inject(TripMembersStore);
  private readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);

  readonly closed = output<void>();
  readonly categories = CATEGORIES;

  @ViewChild('titleInput') private readonly titleInputRef!: ElementRef<HTMLInputElement>;

  readonly form = this.fb.group({
    title:        ['', Validators.required],
    amount:       [null as number | null, [Validators.required, Validators.min(0.01)]],
    date:         [new Date().toISOString().slice(0, 10), Validators.required],
    category:     [''],
    paidByUserId: [''],
  });

  readonly paidByOptions = computed(() => {
    const members = this.membersStore.members();
    const currentUser = this.authStore.user();
    const options = members.map((m) => ({
      userId: m.userId,
      label: m.user.name || m.user.email,
    }));
    if (currentUser && !members.some((m) => m.userId === currentUser.id)) {
      options.unshift({ userId: currentUser.id, label: currentUser.name || currentUser.email });
    }
    return options;
  });

  ngAfterViewInit(): void {
    setTimeout(() => this.titleInputRef?.nativeElement?.focus(), 60);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closed.emit(); }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onClose(): void { this.closed.emit(); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { title, amount, category, paidByUserId } = this.form.value;
    this.store.createItem(
      {
        title: title!.trim(),
        amount: amount!,
        category: category || 'OTHER',
        paidByUserId: paidByUserId || undefined,
      },
      () => this.closed.emit(),
    );
  }
}
