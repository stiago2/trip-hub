import { Component, computed, inject, signal } from '@angular/core';
import { InventoryItem } from '@org/util-types';
import { InventoryStore } from '../store/inventory.store';
import { AddItemModalComponent } from '../components/add-item-modal/add-item-modal.component';

const CATEGORY_LABELS: Record<InventoryItem['category'], string> = {
  CLOTHING: 'Clothing',
  TECH: 'Tech',
  TOILETRIES: 'Toiletries',
  DOCUMENTS: 'Documents',
  OTHER: 'Other',
};

const CATEGORY_GRADIENTS: Record<InventoryItem['category'], string> = {
  CLOTHING:   'linear-gradient(160deg, #7c3aed 0%, #a78bfa 100%)',
  TECH:       'linear-gradient(160deg, #1d4ed8 0%, #60a5fa 100%)',
  TOILETRIES: 'linear-gradient(160deg, #0891b2 0%, #38bdf8 100%)',
  DOCUMENTS:  'linear-gradient(160deg, #b45309 0%, #fbbf24 100%)',
  OTHER:      'linear-gradient(160deg, #334155 0%, #94a3b8 100%)',
};

const CATEGORY_ICONS: Record<InventoryItem['category'], string> = {
  DOCUMENTS: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>`,
  CLOTHING: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
  </svg>`,
  TECH: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <path d="M8 21h8M12 17v4"/>
  </svg>`,
  TOILETRIES: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 2h1v3H9zM14 2h1v3h-1z"/>
    <path d="M7 5h10a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1z"/>
    <line x1="10" y1="10" x2="14" y2="10"/>
  </svg>`,
  OTHER: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>`,
};

type TabId = 'ALL' | InventoryItem['category'];

@Component({
  selector: 'lib-inventory-page',
  standalone: true,
  imports: [AddItemModalComponent],
  template: `
    <div class="inventory-page">

      <!-- ── Header ── -->
      <div class="page-header">
        <div class="header-left">
          <h2 class="page-title">Packing List</h2>
          <div class="stat-pills">
            <span class="pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {{ store.items().length }} items
            </span>
            <span class="pill pill--green">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {{ packedCount() }} packed
            </span>
            <span class="pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
              {{ store.itemsByCategory().length }} categories
            </span>
            @if (store.items().length > 0) {
              <span class="pill" [class.pill--green]="packPercent() === 100">
                {{ packPercent() }}% ready
              </span>
            }
          </div>
        </div>
        <button class="btn-add" (click)="showModal.set(true)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Item
        </button>
      </div>

      <!-- ── Filter tabs ── -->
      <div class="filter-tabs">
        @for (tab of tabs(); track tab.id) {
          <button
            class="tab"
            [class.tab--active]="activeTab() === tab.id"
            (click)="activeTab.set(tab.id)"
          >
            {{ tab.label }}
            <span class="tab-count" [class.tab-count--active]="activeTab() === tab.id">{{ tab.count }}</span>
          </button>
        }
      </div>

      @if (store.loading()) {
        <p class="state-msg">Loading...</p>
      } @else if (store.items().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <p class="empty-title">Your packing list is empty</p>
          <p class="empty-sub">Add items to start organizing your gear.</p>
        </div>
      } @else if (filteredGroups().length === 0) {
        <p class="state-msg">No items in this category.</p>
      } @else {

        <!-- ── Item cards ── -->
        <div class="items-list">
          @for (group of filteredGroups(); track group.category) {

            @if (activeTab() === 'ALL') {
              <div class="group-label">
                <span class="group-dot" [style.background]="categoryColor(group.category)"></span>
                {{ categoryLabel(group.category) }}
                <span class="group-count">{{ group.items.length }}</span>
              </div>
            }

            @for (item of group.items; track item.id) {
              <div class="item-card card" [class.item-card--packed]="item.packed">
                <!-- Left panel -->
                <div class="item-panel" [style.background]="categoryGradient(item.category)">
                  <span class="panel-icon" [innerHTML]="categoryIcon(item.category)"></span>
                  @if (item.packed) {
                    <span class="panel-check">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  }
                </div>

                <!-- Content -->
                <div class="item-content">
                  <div class="item-top">
                    <span class="cat-badge" [style.background]="categoryColor(item.category) + '22'" [style.color]="categoryColor(item.category)">
                      {{ categoryLabel(item.category) }}
                    </span>
                    <span class="qty-badge">×{{ item.quantity }}</span>
                  </div>
                  <p class="item-name" [class.item-name--packed]="item.packed">{{ item.name }}</p>
                </div>

                <!-- Right: checkbox + delete -->
                <div class="item-actions">
                  <label class="check-label" [title]="item.packed ? 'Mark unpacked' : 'Mark packed'">
                    <input
                      type="checkbox"
                      class="item-check"
                      [checked]="item.packed"
                      (change)="store.togglePacked(item)"
                    />
                    <span class="check-box" [class.check-box--checked]="item.packed">
                      @if (item.packed) {
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      }
                    </span>
                  </label>
                  <button class="btn-delete" (click)="store.deleteItem(item.id)" title="Remove">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            }
          }
        </div>

        <!-- ── Summary bar ── -->
        <div class="summary-bar">
          <div class="summary-progress">
            <div class="mini-ring">
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3.5"/>
                <circle cx="22" cy="22" r="17" fill="none" stroke="#60a5fa" stroke-width="3.5"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="circumference"
                  [attr.stroke-dashoffset]="dashOffset()"
                  transform="rotate(-90 22 22)"/>
              </svg>
              <span class="ring-pct">{{ packPercent() }}%</span>
            </div>
            <div class="summary-text">
              <span class="summary-label">Packing Progress</span>
              <span class="summary-value">{{ packedCount() }} / {{ store.items().length }} items packed</span>
            </div>
          </div>
          <div class="summary-stats">
            <div class="summary-stat">
              <span class="stat-num">{{ store.items().length }}</span>
              <span class="stat-lbl">Total Items</span>
            </div>
            <div class="stat-divider"></div>
            <div class="summary-stat">
              <span class="stat-num">{{ packedCount() }}</span>
              <span class="stat-lbl">Packed</span>
            </div>
            <div class="stat-divider"></div>
            <div class="summary-stat">
              <span class="stat-num">{{ store.items().length - packedCount() }}</span>
              <span class="stat-lbl">Remaining</span>
            </div>
            <div class="stat-divider"></div>
            <div class="summary-stat">
              <span class="stat-num">{{ store.itemsByCategory().length }}</span>
              <span class="stat-lbl">Categories</span>
            </div>
          </div>
        </div>

      }
    </div>

    @if (showModal()) {
      <lib-add-item-modal (closed)="showModal.set(false)" />
    }
  `,
  styles: [`
    .inventory-page { padding: var(--space-2) 0 var(--space-6); }

    /* ── Header ── */
    .header-left { display: flex; flex-direction: column; gap: 10px; }

    .stat-pills { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .pill {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px var(--space-3); background: var(--color-surface-muted);
      border: 1px solid var(--color-border); border-radius: var(--radius-3xl);
      font-size: var(--font-size-caption); font-weight: var(--font-weight-semibold); color: #475569;
    }
    .pill--green { background: #f0fdf4; border-color: #bbf7d0; color: #16a34a; }

    /* ── Filter tabs ── */
    .filter-tabs {
      display: flex; gap: 0; border-bottom: 2px solid var(--color-border);
      margin-bottom: var(--space-5); overflow-x: auto; scrollbar-width: none;
    }
    .filter-tabs::-webkit-scrollbar { display: none; }
    .tab {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 18px; background: none; border: none;
      border-bottom: 2px solid transparent; margin-bottom: -2px;
      font-size: var(--font-size-body); font-weight: var(--font-weight-medium); color: var(--color-text-soft);
      cursor: pointer; transition: color var(--transition-fast), border-color var(--transition-fast);
      white-space: nowrap;
    }
    .tab:hover { color: var(--color-text-body); }
    .tab--active { color: var(--color-action); border-bottom-color: var(--color-action); font-weight: var(--font-weight-semibold); }
    .tab-count {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 20px; height: 20px; padding: 0 5px;
      background: var(--color-surface-muted); border-radius: var(--radius-lg);
      font-size: 0.72rem; font-weight: var(--font-weight-semibold); color: var(--color-text-soft);
    }
    .tab-count--active { background: #dbeafe; color: var(--color-action-hover); }

    /* ── States ── */
    .state-msg { color: var(--color-text-soft); }

    .empty-icon {
      width: 64px; height: 64px; border-radius: var(--radius-2xl);
      background: var(--color-surface-muted); color: var(--color-text-subtle);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: var(--space-4);
    }
    .empty-title { margin: 0 0 6px; font-size: 1rem; font-weight: var(--font-weight-bold); color: var(--color-dark-surface); }
    .empty-sub { margin: 0; font-size: var(--font-size-body); color: var(--color-text-soft); }

    /* ── Group label ── */
    .group-label {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) 4px 6px;
      font-size: var(--font-size-caption); font-weight: var(--font-weight-bold); color: var(--color-text-soft);
      text-transform: uppercase; letter-spacing: var(--tracking-open);
    }
    .group-label:first-child { padding-top: 0; }
    .group-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .group-count {
      margin-left: auto;
      font-size: 0.72rem; font-weight: var(--font-weight-semibold); color: var(--color-text-subtle);
      background: var(--color-surface-muted); border-radius: var(--radius-md); padding: 1px 7px;
    }

    /* ── Item cards (boarding-pass style) ── */
    .items-list { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }

    .item-card {
      display: flex; align-items: stretch;
      border-radius: var(--radius-xl); overflow: hidden;
      transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
    }
    .item-card:hover {
      box-shadow: 0 3px 10px rgba(0,0,0,0.08);
      border-color: var(--color-text-dim);
    }
    .item-card--packed { opacity: 0.7; }

    /* Left gradient panel */
    .item-panel {
      width: 52px; flex-shrink: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 6px;
      color: rgba(255,255,255,0.9); position: relative;
    }
    .panel-icon { display: flex; align-items: center; justify-content: center; }
    .panel-check {
      width: 18px; height: 18px; border-radius: 50%;
      background: rgba(255,255,255,0.25);
      display: flex; align-items: center; justify-content: center;
      color: white;
    }

    /* Content */
    .item-content {
      flex: 1; padding: 10px var(--space-3);
      display: flex; flex-direction: column; justify-content: center; gap: 4px;
      min-width: 0;
    }
    .item-top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .cat-badge {
      font-size: var(--font-size-2xs); font-weight: var(--font-weight-bold); letter-spacing: 0.04em;
      padding: 2px 8px; border-radius: 6px;
      text-transform: uppercase;
    }
    .qty-badge {
      font-size: 0.72rem; font-weight: var(--font-weight-bold);
      background: var(--color-surface-muted); color: #475569;
      padding: 2px 7px; border-radius: 6px;
    }
    .item-name {
      margin: 0; font-size: 0.9rem; font-weight: var(--font-weight-semibold); color: var(--color-dark-surface);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .item-name--packed { text-decoration: line-through; color: var(--color-text-subtle); }

    /* Right actions */
    .item-actions {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 6px;
      padding: 10px var(--space-3); flex-shrink: 0;
    }

    .check-label { cursor: pointer; display: block; }
    .check-label input { display: none; }
    .check-box {
      width: 22px; height: 22px; border-radius: 6px;
      border: 2px solid var(--color-text-dim); background: var(--color-surface);
      display: flex; align-items: center; justify-content: center;
      transition: background var(--transition-fast), border-color var(--transition-fast);
    }
    .check-box--checked { background: var(--color-action); border-color: var(--color-action); color: white; }
    .check-label:hover .check-box:not(.check-box--checked) { border-color: var(--color-action); }

    .btn-delete {
      background: none; border: none; color: transparent;
      cursor: pointer; padding: 4px; border-radius: 6px;
      transition: color var(--transition-fast), background var(--transition-fast);
      display: flex; align-items: center; justify-content: center;
    }
    .item-card:hover .btn-delete { color: var(--color-text-dim); }
    .item-card:hover .btn-delete:hover { color: var(--color-danger); background: var(--color-danger-light); }

    /* ── Summary bar ── */
    .summary-bar {
      background: linear-gradient(135deg, var(--color-dark-bg) 0%, var(--color-dark-surface) 100%);
      border-radius: 14px; padding: var(--space-5) var(--space-6);
      display: flex; align-items: center; justify-content: space-between;
      gap: var(--space-6); flex-wrap: wrap;
      box-shadow: 0 4px 16px rgba(15,23,42,0.18);
    }

    .summary-progress { display: flex; align-items: center; gap: 14px; }
    .mini-ring { position: relative; width: 44px; height: 44px; flex-shrink: 0; }
    .ring-pct {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.62rem; font-weight: var(--font-weight-extrabold); color: white;
    }
    .summary-text { display: flex; flex-direction: column; gap: 2px; }
    .summary-label { font-size: var(--font-size-2xs); color: rgba(255,255,255,0.5); font-weight: var(--font-weight-semibold); text-transform: uppercase; letter-spacing: var(--tracking-open); }
    .summary-value { font-size: var(--font-size-body); color: white; font-weight: var(--font-weight-bold); }

    .summary-stats { display: flex; align-items: center; gap: 16px; }
    .summary-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .stat-num { font-size: 1.2rem; font-weight: var(--font-weight-extrabold); color: white; line-height: var(--leading-tight); }
    .stat-lbl { font-size: 0.68rem; color: rgba(255,255,255,0.45); font-weight: var(--font-weight-medium); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.1); }

    @media (max-width: 600px) {
      .summary-bar { flex-direction: column; align-items: flex-start; }
      .summary-stats { flex-wrap: wrap; }
    }
  `],
})
export class InventoryPageComponent {
  readonly store = inject(InventoryStore);

  readonly showModal = signal(false);
  readonly activeTab = signal<TabId>('ALL');

  readonly tabs = computed(() => {
    const groups = this.store.itemsByCategory();
    const all = this.store.items().length;
    const categoryTabs = groups.map((g) => ({
      id: g.category as TabId,
      label: CATEGORY_LABELS[g.category],
      count: g.items.length,
    }));
    return [{ id: 'ALL' as TabId, label: 'All Items', count: all }, ...categoryTabs];
  });

  readonly filteredGroups = computed(() => {
    const tab = this.activeTab();
    const groups = this.store.itemsByCategory();
    if (tab === 'ALL') return groups;
    return groups.filter((g) => g.category === tab);
  });

  readonly packedCount = computed(() => this.store.items().filter((i) => i.packed).length);
  readonly packPercent = computed(() => {
    const total = this.store.items().length;
    return total === 0 ? 0 : Math.round((this.packedCount() / total) * 100);
  });
  readonly circumference = 2 * Math.PI * 17;
  readonly dashOffset = computed(() => this.circumference * (1 - this.packPercent() / 100));

  categoryLabel(cat: InventoryItem['category']): string {
    return CATEGORY_LABELS[cat];
  }

  categoryGradient(cat: InventoryItem['category']): string {
    return CATEGORY_GRADIENTS[cat];
  }

  categoryIcon(cat: InventoryItem['category']): string {
    return CATEGORY_ICONS[cat];
  }

  categoryColor(cat: InventoryItem['category']): string {
    const map: Record<InventoryItem['category'], string> = {
      CLOTHING: '#7c3aed', TECH: '#1d4ed8', TOILETRIES: '#0891b2',
      DOCUMENTS: '#b45309', OTHER: '#475569',
    };
    return map[cat];
  }
}
