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
    <div class="backdrop" (click)="onClose()">
      <div class="modal" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <div>
            <h2 class="modal-title">Add Inventory Item</h2>
            <p class="modal-subtitle">Enter the details of the item you want to pack.</p>
          </div>
          <button class="close-btn" type="button" (click)="onClose()">
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

          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="onClose()">Cancel</button>
            <button type="submit" class="btn-submit">Add Item</button>
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
    }

    .modal {
      background: #fff;
      border-radius: 16px;
      padding: 28px 28px 24px;
      width: 100%; max-width: 440px;
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
    }
    .close-btn:hover { color: #374151; background: #f3f4f6; }

    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }

    .field-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #374151;
      letter-spacing: 0.01em;
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
    }
    .field-input::placeholder { color: #9ca3af; }
    .field-input:focus { border-color: #4f46e5; }
    .field-input.error { border-color: #ef4444; }

    .field-error { font-size: 0.78rem; color: #ef4444; }

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
    }
    .field-select:focus { border-color: #4f46e5; }

    .select-chevron {
      position: absolute;
      right: 12px; top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: #6b7280;
    }

    .quantity-row {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f9fafb;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      padding: 10px 14px;
    }

    .stepper {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-left: auto;
    }

    .stepper-btn {
      width: 32px; height: 32px;
      border-radius: 50%;
      border: 1.5px solid #d1d5db;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      color: #374151;
      transition: background 150ms, border-color 150ms;
      padding: 0;
    }
    .stepper-btn:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
    .stepper-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    .stepper-value {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      min-width: 24px;
      text-align: center;
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
      padding: 10px 18px;
      border: none;
      border-radius: 10px;
      background: #4f46e5;
      color: #fff;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms;
    }
    .btn-submit:hover { background: #4338ca; }
  `],
})
export class AddItemModalComponent implements AfterViewInit {
  private readonly store = inject(InventoryStore);
  private readonly fb = inject(FormBuilder);

  readonly closed = output<void>();
  readonly categories = CATEGORIES;
  readonly quantity = signal(1);

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
    this.store.createItem(
      {
        name,
        category: this.form.get('category')!.value as InventoryItem['category'],
        quantity: this.quantity(),
      },
      () => this.closed.emit(),
    );
  }
}
