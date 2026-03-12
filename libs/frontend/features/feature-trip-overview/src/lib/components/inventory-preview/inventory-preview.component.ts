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
    <div class="preview-card">
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
      background: white;
      border: 1px solid #e8edf3;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px; padding-bottom: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .card-title { font-size: 0.875rem; font-weight: 700; color: #0f172a; }
    .card-link {
      font-size: 0.775rem; font-weight: 600; color: #3b82f6;
      text-decoration: none; padding: 3px 8px; border-radius: 6px;
      background: #eff6ff; transition: background 0.15s;
    }
    .card-link:hover { background: #dbeafe; }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 0 8px; }
    .empty-icon-wrap {
      width: 52px; height: 52px; border-radius: 14px;
      background: #f8fafc;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
    }
    .empty-title { margin: 0; font-size: 0.875rem; color: #64748b; font-weight: 600; }
    .btn-add {
      display: flex; align-items: center; gap: 5px; margin-top: 4px;
      background: #f8fafc; color: #475569; text-decoration: none;
      font-size: 0.8rem; font-weight: 600; padding: 8px 16px;
      border-radius: 8px; border: 1px solid #e2e8f0;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .btn-add:hover { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }

    .progress-bar-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .progress-bar {
      flex: 1;
      height: 6px;
      background: #f1f5f9;
      border-radius: 99px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: #22c55e;
      border-radius: 99px;
      transition: width 0.3s ease;
    }
    .progress-label { font-size: 0.75rem; color: #64748b; white-space: nowrap; }

    .item-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
    .item-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 6px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.12s;
    }
    .item-row:hover { background: #f8fafc; }

    .item-check {
      width: 16px; height: 16px; border-radius: 4px;
      border: 1.5px solid #cbd5e1;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      color: white;
      transition: background 0.15s, border-color 0.15s;
    }
    .item-check--packed { background: #22c55e; border-color: #22c55e; }

    .item-name { font-size: 0.875rem; color: #334155; flex: 1; }
    .item-name--packed { color: #94a3b8; text-decoration: line-through; }

    .item-category {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #94a3b8;
    }

    .more-link {
      display: block;
      margin-top: 10px;
      font-size: 0.8rem;
      color: #3b82f6;
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
