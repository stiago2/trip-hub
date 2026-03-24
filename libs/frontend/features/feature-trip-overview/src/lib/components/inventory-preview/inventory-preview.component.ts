import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InventoryStore } from '@org/feature-inventory';
import { InventoryItem } from '@org/util-types';

const CATEGORY_LABEL: Record<InventoryItem['category'], string> = {
  CLOTHING: 'Clothing',
  TECH: 'Tech',
  TOILETRIES: 'Toiletries',
  DOCUMENTS: 'Documents',
  OTHER: 'Other',
};

@Component({
  selector: 'lib-inventory-preview',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="preview-card card">
      <div class="card-header">
        <span class="card-title">Packing List</span>
        <a class="card-link" [routerLink]="['/trips', tripId(), 'inventory']">See all</a>
      </div>

      @if (items().length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <p class="empty-title">No items added yet</p>
          <a class="btn-add" [routerLink]="['/trips', tripId(), 'inventory']">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Start packing list
          </a>
        </div>
      } @else {
        <div class="progress-bar-wrap">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="packPercent()"></div>
          </div>
          <span class="progress-label">{{ packedCount() }}/{{ items().length }} packed</span>
        </div>

        <ul class="item-list">
          @for (item of previewItems(); track item.id) {
            <li class="item-row" (click)="toggle(item)">
              <span class="item-check" [class.item-check--packed]="item.packed">
                @if (item.packed) {
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                }
              </span>
              <span class="item-name" [class.item-name--packed]="item.packed">{{ item.name }}</span>
              <span class="item-category">{{ categoryLabel(item.category) }}</span>
            </li>
          }
        </ul>

        @if (items().length > 4) {
          <a class="more-link" [routerLink]="['/trips', tripId(), 'inventory']">
            +{{ items().length - 4 }} more items
          </a>
        }
      }
    </div>
  `,
  styles: [`
    .preview-card {
      padding: var(--space-5);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3-5); padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--color-surface-muted);
    }
    .card-title { font-size: var(--font-size-body); font-weight: var(--font-weight-bold); color: var(--color-text); }
    .card-link {
      font-size: 0.775rem; font-weight: var(--font-weight-semibold); color: var(--color-action);
      text-decoration: none; padding: 3px 8px; border-radius: 6px;
      background: var(--color-action-light); transition: background var(--transition-fast);
    }
    .card-link:hover { background: #dbeafe; }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-4) 0 var(--space-2); }
    .empty-icon-wrap {
      width: 52px; height: 52px; border-radius: 14px;

      background: var(--color-surface-subtle);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
    }
    .empty-title { margin: 0; font-size: var(--font-size-body); color: var(--color-text-soft); font-weight: var(--font-weight-semibold); }
    .btn-add {
      display: flex; align-items: center; gap: 5px; margin-top: 4px;
      background: var(--color-surface-subtle); color: #475569; text-decoration: none;
      font-size: 0.8rem; font-weight: var(--font-weight-semibold); padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md); border: 1px solid var(--color-border);
      transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
    }
    .btn-add:hover { background: var(--color-action-light); border-color: #bfdbfe; color: var(--color-action-hover); }

    .progress-bar-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: var(--space-3);
    }
    .progress-bar {
      flex: 1;
      height: 6px;
      background: var(--color-surface-muted);
      border-radius: var(--radius-full);
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: #22c55e;
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }
    .progress-label { font-size: 0.75rem; color: var(--color-text-soft); white-space: nowrap; }

    .item-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
    .item-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 4px 6px;
      border-radius: 6px;
      cursor: pointer;
      transition: background var(--transition-fast);
    }
    .item-row:hover { background: var(--color-surface-subtle); }

    .item-check {
      width: 16px; height: 16px; border-radius: 4px;
      border: 1.5px solid var(--color-text-dim);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      color: white;
      transition: background var(--transition-fast), border-color var(--transition-fast);
    }
    .item-check--packed { background: #22c55e; border-color: #22c55e; }

    .item-name { font-size: var(--font-size-body); color: var(--color-text-body); flex: 1; }
    .item-name--packed { color: var(--color-text-subtle); text-decoration: line-through; }

    .item-category {
      font-size: var(--font-size-2xs);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-subtle);
    }

    .more-link {
      display: block;
      margin-top: 10px;
      font-size: 0.8rem;
      color: var(--color-action);
      text-decoration: none;
    }
    .more-link:hover { text-decoration: underline; }
  `],
})
export class InventoryPreviewComponent {
  private readonly inventoryStore = inject(InventoryStore);

  readonly items = input<InventoryItem[]>([]);
  readonly tripId = input('');

  readonly previewItems = computed(() => this.items().slice(0, 4));
  readonly packedCount = computed(() => this.items().filter((i) => i.packed).length);
  readonly packPercent = computed(() => {
    const total = this.items().length;
    return total === 0 ? 0 : Math.round((this.packedCount() / total) * 100);
  });

  toggle(item: InventoryItem): void {
    this.inventoryStore.togglePacked(item);
  }

  categoryLabel(cat: InventoryItem['category']): string {
    return CATEGORY_LABEL[cat];
  }
}
