import { AfterViewInit, Component, ElementRef, HostListener, inject, output, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryItem } from '@org/util-types';
import { InventoryStore } from '../../store/inventory.store';

interface CategoryOption { value: InventoryItem['category']; label: string; }

const CATEGORIES: CategoryOption[] = [
  { value: 'CLOTHING', label: 'Clothing' },
  { value: 'TOILETRIES', label: 'Toiletries' },
  { value: 'TECH', label: 'Electronics' },
  { value: 'DOCUMENTS', label: 'Documents' },
  { value: 'OTHER', label: 'Other' },
];

@Component({
  selector: 'lib-add-item-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-shell" (click)="$event.stopPropagation()">

        <div class="modal-header-flat">
          <div>
            <h2 class="modal-title">Add Inventory Item</h2>
            <p class="modal-subtitle">Enter the details of the item you want to pack.</p>
          </div>
          <button class="modal-close-btn" type="button" (click)="onClose()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label class="field-label" for="name">Item Name</label>
            <input
              #nameInput
              id="name"
              class="field-input"
              [class.error]="nameInvalid()"
              formControlName="name"
              placeholder="e.g. Sunscreen, Passport, Laptop"
              autocomplete="off"
            />
            @if (nameInvalid()) {
              <span class="field-error">Item name is required</span>
            }
          </div>

          <div class="field">
            <label class="field-label" for="category">Category</label>
            <div class="select-wrapper">
              <select id="category" class="field-select" formControlName="category">
                @for (cat of categories; track cat.value) {
                  <option [value]="cat.value">{{ cat.label }}</option>
                }
              </select>
              <svg class="select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          <div class="field">
            <label class="field-label">Quantity</label>
            <div class="quantity-row">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <div class="stepper">
                <button type="button" class="stepper-btn" (click)="decrement()" [disabled]="quantity() <= 1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <span class="stepper-value">{{ quantity() }}</span>
                <button type="button" class="stepper-btn" (click)="increment()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer-flat">
            <button type="button" class="btn-cancel" (click)="onClose()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="submitting()">
              @if (submitting()) {
                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              }
              Add Item
            </button>
          </div>
        </form>

      </div>
    </div>
  `,
  styles: [`
    .modal-shell {
      background: var(--color-surface); border-radius: var(--radius-2xl);
      padding: var(--space-7) var(--space-7) var(--space-6); width: 100%; max-width: 440px;
      max-height: 90vh; overflow-y: auto;
      box-shadow: var(--shadow-lg);
      animation: modalSlide 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .modal-header-flat {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: var(--space-6);
    }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
    .select-wrapper { position: relative; }
    .field-select {
      width: 100%; border: 1.5px solid var(--color-border); border-radius: var(--radius-lg);
      padding: 10px 36px 10px 14px; font-size: var(--font-size-base); color: var(--color-text);
      outline: none; appearance: none; background: var(--color-surface);
      cursor: pointer; transition: border-color 150ms;
    }
    .field-select:focus { border-color: var(--color-border-focus); }
    .select-chevron {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      pointer-events: none; color: var(--color-text-muted);
    }
    .quantity-row {
      display: flex; align-items: center; gap: var(--space-3);
      background: var(--color-surface-subtle); border: 1.5px solid var(--color-border);
      border-radius: var(--radius-lg); padding: 10px var(--space-3-5);
    }
    .stepper { display: flex; align-items: center; gap: var(--space-3-5); margin-left: auto; }
    .stepper-btn {
      width: 32px; height: 32px; border-radius: 50%;
      border: 1.5px solid var(--color-border); background: var(--color-surface);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: var(--color-text-secondary);
      transition: background 150ms, border-color 150ms; padding: 0;
    }
    .stepper-btn:hover:not(:disabled) { background: var(--color-surface-muted); border-color: var(--color-text-placeholder); }
    .stepper-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .stepper-value {
      font-size: 1rem; font-weight: var(--font-weight-semibold); color: var(--color-text);
      min-width: 24px; text-align: center;
    }
    .modal-footer-flat { display: flex; gap: var(--space-3); margin-top: var(--space-7); }
    .btn-primary { flex: 1; justify-content: center; }
    @media (max-width: 480px) {
      .modal-shell { border-radius: 20px 20px 0 0; width: 100%; padding: var(--space-5) var(--space-4); }
      .modal-footer-flat { margin-top: var(--space-4); }
    }
  `],
})
export class AddItemModalComponent implements AfterViewInit {
  private readonly store = inject(InventoryStore);
  private readonly fb = inject(FormBuilder);

  readonly closed = output<void>();
  readonly categories = CATEGORIES;
  readonly quantity = signal(1);
  readonly submitting = signal(false);

  @ViewChild('nameInput') private readonly nameInputRef!: ElementRef<HTMLInputElement>;

  readonly form = this.fb.group({
    name: ['', Validators.required],
    category: ['CLOTHING' as InventoryItem['category']],
  });

  ngAfterViewInit(): void {
    setTimeout(() => this.nameInputRef?.nativeElement?.focus(), 60);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closed.emit(); }

  nameInvalid(): boolean {
    const c = this.form.get('name');
    return !!(c?.invalid && c?.touched);
  }

  increment(): void { this.quantity.update(q => q + 1); }

  decrement(): void {
    if (this.quantity() > 1) this.quantity.update(q => q - 1);
  }

  onClose(): void { this.closed.emit(); }

  onSubmit(): void {
    const name = this.form.get('name')!.value?.trim() ?? '';
    if (!name) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.store.createItem(
      {
        name,
        category: this.form.get('category')!.value as InventoryItem['category'],
        quantity: this.quantity(),
      },
      () => this.closed.emit(),
      () => this.submitting.set(false),
    );
  }
}
