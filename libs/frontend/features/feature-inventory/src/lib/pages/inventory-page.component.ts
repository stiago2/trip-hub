import { Component, computed, inject, signal } from '@angular/core';
import { InventoryItem } from '@org/util-types';
import { InventoryStore } from '../store/inventory.store';
import { AddItemModalComponent } from '../components/add-item-modal/add-item-modal.component';

const CATEGORY_META: Record<InventoryItem['category'], { label: string; color: string; bg: string; gradient: string }> = {
  CLOTHING:   { label: 'Clothing',   color: '#7c3aed', bg: '#ede9fe', gradient: 'linear-gradient(145deg, #4c1d95 0%, #7c3aed 100%)' },
  TECH:       { label: 'Tech',       color: '#1d4ed8', bg: '#dbeafe', gradient: 'linear-gradient(145deg, #1e3a8a 0%, #2563eb 100%)' },
  TOILETRIES: { label: 'Toiletries', color: '#0891b2', bg: '#cffafe', gradient: 'linear-gradient(145deg, #164e63 0%, #0891b2 100%)' },
  DOCUMENTS:  { label: 'Documents',  color: '#b45309', bg: '#fef3c7', gradient: 'linear-gradient(145deg, #78350f 0%, #d97706 100%)' },
  OTHER:      { label: 'Other',      color: '#475569', bg: '#f1f5f9', gradient: 'linear-gradient(145deg, #1e293b 0%, #475569 100%)' },
};

type TabId = 'ALL' | InventoryItem['category'];

@Component({
  selector: 'lib-inventory-page',
  standalone: true,
  imports: [AddItemModalComponent],
  template: `
    <div class="inventory-page">

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Packing List</h1>
          @if (store.items().length > 0) {
            <div class="trip-stats">
              <span class="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                {{ store.items().length }} item{{ store.items().length !== 1 ? 's' : '' }}
              </span>
              <span class="stat-pill stat-pill--green">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {{ packedCount() }} packed
              </span>
              @if (packPercent() > 0) {
                <span class="stat-pill" [class.stat-pill--green]="packPercent() === 100">
                  {{ packPercent() }}% ready
                </span>
              }
            </div>
          }
        </div>
        <button class="btn-add" (click)="showModal.set(true)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Item
        </button>
      </div>

      <!-- Filter tabs -->
      <div class="filter-tabs">
        @for (tab of tabs(); track tab.id) {
          <button class="tab" [class.tab--active]="activeTab() === tab.id" (click)="activeTab.set(tab.id)">
            {{ tab.label }}
            <span class="tab-count" [class.tab-count--active]="activeTab() === tab.id">{{ tab.count }}</span>
          </button>
        }
      </div>

      <!-- Loading -->
      @if (store.loading()) {
        <div class="cards-list">
          @for (i of [1,2,3]; track i) { <div class="skeleton-card shimmer"></div> }
        </div>

      <!-- Empty -->
      } @else if (store.items().length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.3"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <p class="empty-title">Your packing list is empty</p>
          <p class="empty-desc">Add items to start organizing what you'll bring.</p>
          <button class="btn-add btn-add--lg" (click)="showModal.set(true)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add First Item
          </button>
        </div>

      <!-- No match -->
      } @else if (filteredGroups().length === 0) {
        <p class="state-msg">No items in this category.</p>

      <!-- Cards -->
      } @else {
        <div class="cards-list">
          @for (group of filteredGroups(); track group.category) {

            @if (activeTab() === 'ALL') {
              <div class="group-label">
                <span class="group-dot" [style.background]="meta(group.category).color"></span>
                {{ meta(group.category).label }}
                <span class="group-count">{{ group.items.length }}</span>
              </div>
            }

            @for (item of group.items; track item.id) {
              <div class="item-card card" [class.item-card--packed]="item.packed">

                <!-- Left gradient panel -->
                <div class="card-panel" [style.background]="meta(item.category).gradient">
                  @switch (item.category) {
                    @case ('CLOTHING') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>
                    }
                    @case ('TECH') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    }
                    @case ('TOILETRIES') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"><path d="M9 2h1v3H9zM14 2h1v3h-1z"/><path d="M7 5h10a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1z"/><line x1="10" y1="10" x2="14" y2="10"/></svg>
                    }
                    @case ('DOCUMENTS') {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    }
                    @default {
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    }
                  }
                  @if (item.packed) {
                    <div class="packed-badge">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  }
                </div>

                <!-- Card body -->
                <div class="card-body">
                  <div class="card-top-row">
                    <span class="category-badge" [style.color]="meta(item.category).color" [style.background]="meta(item.category).bg">
                      {{ meta(item.category).label }}
                    </span>
                    <span class="qty-badge">×{{ item.quantity }}</span>
                  </div>
                  <h3 class="card-name" [class.card-name--packed]="item.packed">{{ item.name }}</h3>
                </div>

                <!-- Checkbox + delete -->
                <div class="card-actions-right">
                  <label class="check-label" [title]="item.packed ? 'Mark unpacked' : 'Mark packed'">
                    <input type="checkbox" class="sr-only" [checked]="item.packed" (change)="store.togglePacked(item)" />
                    <span class="check-box" [class.check-box--checked]="item.packed">
                      @if (item.packed) {
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                      }
                    </span>
                  </label>
                  <button class="btn-delete" (click)="store.deleteItem(item.id)" title="Remove">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
            }
          }
        </div>

        <!-- Summary bar -->
        <div class="summary-bar">
          <div class="summary-progress">
            <div class="mini-ring">
              <svg width="46" height="46" viewBox="0 0 46 46">
                <circle cx="23" cy="23" r="18" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3.5"/>
                <circle cx="23" cy="23" r="18" fill="none" stroke="#60a5fa" stroke-width="3.5"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="circumference"
                  [attr.stroke-dashoffset]="dashOffset()"
                  transform="rotate(-90 23 23)"/>
              </svg>
              <span class="ring-pct">{{ packPercent() }}%</span>
            </div>
            <div class="summary-main">
              <span class="summary-eyebrow">PACKING PROGRESS</span>
              <span class="summary-total">{{ packedCount() }} / {{ store.items().length }} items packed</span>
            </div>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-stats">
            <div class="summary-stat">
              <span class="summary-stat-label">TOTAL ITEMS</span>
              <span class="summary-stat-value">{{ store.items().length }}</span>
            </div>
            <div class="summary-stat">
              <span class="summary-stat-label">PACKED</span>
              <span class="summary-stat-value" style="color:#60a5fa">{{ packedCount() }}</span>
            </div>
            <div class="summary-stat">
              <span class="summary-stat-label">REMAINING</span>
              <span class="summary-stat-value">{{ store.items().length - packedCount() }}</span>
            </div>
            <div class="summary-stat">
              <span class="summary-stat-label">CATEGORIES</span>
              <span class="summary-stat-value">{{ store.itemsByCategory().length }}</span>
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

    /* Header */
    .header-left { display: flex; flex-direction: column; gap: 10px; }
    .trip-stats { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .stat-pill--green { color: #059669; background: #ecfdf5; }

    /* Filter tabs */
    .filter-tabs { display: flex; gap: 0; border-bottom: 2px solid var(--color-border); margin-bottom: var(--space-5); overflow-x: auto; scrollbar-width: none; }
    .filter-tabs::-webkit-scrollbar { display: none; }
    .tab { display: flex; align-items: center; gap: 6px; padding: 10px 18px; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: var(--font-size-body); font-weight: var(--font-weight-medium); color: var(--color-text-soft); cursor: pointer; transition: color var(--transition-fast), border-color var(--transition-fast); white-space: nowrap; }
    .tab:hover { color: var(--color-text-body); }
    .tab--active { color: var(--color-action); border-bottom-color: var(--color-action); font-weight: var(--font-weight-semibold); }
    .tab-count { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 5px; background: var(--color-surface-muted); border-radius: var(--radius-lg); font-size: 0.72rem; font-weight: var(--font-weight-semibold); color: var(--color-text-soft); }
    .tab-count--active { background: #dbeafe; color: var(--color-action-hover); }

    /* Cards list */
    .cards-list { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }

    /* Group label */
    .group-label { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) 4px 6px; font-size: var(--font-size-caption); font-weight: var(--font-weight-bold); color: var(--color-text-soft); text-transform: uppercase; letter-spacing: var(--tracking-open); }
    .group-label:first-child { padding-top: 0; }
    .group-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .group-count { margin-left: auto; font-size: 0.72rem; font-weight: var(--font-weight-semibold); color: var(--color-text-subtle); background: var(--color-surface-muted); border-radius: var(--radius-md); padding: 1px 7px; }

    /* Item card */
    .item-card { display: flex; flex-direction: row; position: relative; overflow: visible; transition: transform var(--transition-normal), box-shadow var(--transition-normal); }
    .item-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.10); }
    .item-card--packed { opacity: 0.65; }

    /* Left gradient panel */
    .card-panel { width: 64px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; border-radius: 15px 0 0 15px; overflow: hidden; padding: var(--space-4) var(--space-2); }
    .packed-badge { width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; color: white; }

    /* Card body */
    .card-body { flex: 1; padding: 14px 16px; display: flex; flex-direction: column; gap: 5px; }
    .card-top-row { display: flex; align-items: center; gap: 8px; }
    .category-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-3xl); font-size: 0.68rem; font-weight: var(--font-weight-bold); letter-spacing: var(--tracking-wide); }
    .qty-badge { font-size: 0.72rem; font-weight: var(--font-weight-bold); background: var(--color-surface-muted); color: #475569; padding: 2px 8px; border-radius: 6px; }
    .card-name { margin: 0; font-size: var(--font-size-card); font-weight: var(--font-weight-extrabold); color: var(--color-text); letter-spacing: var(--tracking-tight); }
    .card-name--packed { text-decoration: line-through; color: var(--color-text-subtle); }

    /* Right actions */
    .card-actions-right { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 12px 14px; flex-shrink: 0; }
    .check-label { cursor: pointer; display: block; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
    .check-box { width: 24px; height: 24px; border-radius: 7px; border: 2px solid var(--color-text-dim); background: var(--color-surface); display: flex; align-items: center; justify-content: center; transition: background var(--transition-fast), border-color var(--transition-fast); }
    .check-box--checked { background: var(--color-action); border-color: var(--color-action); color: white; }
    .check-label:hover .check-box:not(.check-box--checked) { border-color: var(--color-action); }
    .btn-delete { background: none; border: none; color: transparent; cursor: pointer; padding: 4px; border-radius: 6px; transition: color var(--transition-fast), background var(--transition-fast); display: flex; align-items: center; justify-content: center; }
    .item-card:hover .btn-delete { color: var(--color-text-dim); }
    .item-card:hover .btn-delete:hover { color: var(--color-danger); background: var(--color-danger-light); }

    /* Skeleton */
    .skeleton-card { height: 80px; border-radius: var(--radius-2xl); }

    /* Summary bar */
    .summary-bar { display: flex; align-items: center; gap: var(--space-5); background: var(--color-dark-bg); border-radius: var(--radius-2xl); padding: 22px var(--space-7); margin-top: var(--space-2); color: white; flex-wrap: wrap; }
    .summary-progress { display: flex; align-items: center; gap: 14px; }
    .mini-ring { position: relative; width: 46px; height: 46px; flex-shrink: 0; }
    .ring-pct { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: var(--font-weight-extrabold); color: white; }
    .summary-main { display: flex; flex-direction: column; gap: 3px; }
    .summary-eyebrow { font-size: 0.65rem; font-weight: var(--font-weight-semibold); letter-spacing: var(--tracking-widest); color: var(--color-text-soft); text-transform: uppercase; }
    .summary-total { font-size: var(--font-size-body); font-weight: var(--font-weight-bold); color: white; }
    .summary-divider { width: 1px; background: var(--color-dark-surface); align-self: stretch; flex-shrink: 0; }
    .summary-stats { display: flex; gap: 32px; margin-left: 4px; flex-wrap: wrap; }
    .summary-stat { display: flex; flex-direction: column; gap: 3px; }
    .summary-stat-label { font-size: 0.65rem; font-weight: var(--font-weight-semibold); letter-spacing: var(--tracking-widest); color: var(--color-text-soft); text-transform: uppercase; }
    .summary-stat-value { font-size: 1.1rem; font-weight: var(--font-weight-bold); color: white; }

    /* State */
    .state-msg { color: var(--color-text-soft); }

    @media (max-width: 600px) {
      .card-panel { width: 52px; }
      .summary-bar { gap: 14px; }
      .summary-stats { gap: 16px; }
      .page-title { font-size: 1.1rem; }
      .btn-add { padding: var(--space-2) var(--space-3); font-size: 0.8rem; gap: 5px; }
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
      label: CATEGORY_META[g.category].label,
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
  readonly circumference = 2 * Math.PI * 18;
  readonly dashOffset = computed(() => this.circumference * (1 - this.packPercent() / 100));

  meta(cat: InventoryItem['category']) {
    return CATEGORY_META[cat];
  }
}
