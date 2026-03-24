import { AfterViewInit, Component, computed, ElementRef, HostListener, inject, output, signal, ViewChild } from '@angular/core';
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
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-shell" (click)="$event.stopPropagation()">

        <div class="modal-header-flat">
          <div>
            <h2 class="modal-title">Add New Expense</h2>
            <p class="modal-subtitle">Track your spending for this trip</p>
          </div>
          <button class="modal-close-btn" type="button" (click)="onClose()">
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

          <div class="modal-footer-flat">
            <button type="button" class="btn-cancel" (click)="onClose()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || submitting()">
              @if (submitting()) {
                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              } @else {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              }
              Add Expense
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-shell {
      background: var(--color-surface); border-radius: var(--radius-2xl);
      padding: var(--space-7) var(--space-7) var(--space-6); width: 100%; max-width: 500px;
      max-height: 90vh; overflow-y: auto;
      box-shadow: var(--shadow-lg);
      animation: modalSlide 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .modal-header-flat {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: var(--space-6);
    }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--space-4); }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .amount-wrapper { position: relative; }
    .amount-prefix {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      font-size: var(--font-size-base); font-weight: var(--font-weight-semibold);
      color: var(--color-text-muted); pointer-events: none;
    }
    .field-input--amount { padding-left: 26px; }
    .select-wrapper { position: relative; }
    .field-select {
      width: 100%; border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
      padding: 9px 34px 9px 12px; font-size: var(--font-size-base); color: var(--color-text);
      outline: none; appearance: none; background: var(--color-surface);
      cursor: pointer; transition: border-color 150ms; box-sizing: border-box;
    }
    .field-select:focus { border-color: var(--color-border-focus); }
    .field-select option[value=""][disabled] { color: var(--color-text-placeholder); }
    .select-chevron {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      pointer-events: none; color: var(--color-text-muted);
    }
    .modal-footer-flat {
      display: flex; align-items: center; justify-content: flex-end;
      gap: var(--space-3); margin-top: var(--space-6);
    }
    @media (max-width: 480px) {
      .modal-shell { border-radius: 20px 20px 0 0; width: 100%; padding: var(--space-5) var(--space-4); }
      .modal-footer-flat { margin-top: var(--space-4); }
    }
  `],
})
export class AddExpenseModalComponent implements AfterViewInit {
  private readonly store = inject(BudgetStore);
  private readonly membersStore = inject(TripMembersStore);
  private readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);

  readonly closed = output<void>();
  readonly categories = CATEGORIES;
  readonly submitting = signal(false);

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
    this.submitting.set(true);
    this.store.createItem(
      {
        title: title!.trim(),
        amount: amount!,
        category: category || 'OTHER',
        paidByUserId: paidByUserId || undefined,
      },
      () => this.closed.emit(),
      () => this.submitting.set(false),
    );
  }
}
