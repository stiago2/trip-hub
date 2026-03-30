import { CurrencyPipe, DatePipe, DecimalPipe, SlicePipe, UpperCasePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { BudgetStore } from '../store/budget.store';
import { AddExpenseModalComponent } from '../components/add-expense-modal/add-expense-modal.component';
import { TripMembersStore } from '@org/feature-trip-members';

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
  TRANSPORT:     { label: 'Transport', color: '#1d4ed8', bg: '#dbeafe', gradient: 'linear-gradient(145deg, #1e3a8a 0%, #2563eb 100%)' },
  FOOD:          { label: 'Food',      color: '#b45309', bg: '#fef3c7', gradient: 'linear-gradient(145deg, #78350f 0%, #d97706 100%)' },
  ACCOMMODATION: { label: 'Hotel',     color: '#7c3aed', bg: '#ede9fe', gradient: 'linear-gradient(145deg, #4c1d95 0%, #7c3aed 100%)' },
  ACTIVITY:      { label: 'Activity',  color: '#059669', bg: '#d1fae5', gradient: 'linear-gradient(145deg, #064e3b 0%, #059669 100%)' },
  OTHER:         { label: 'Other',     color: '#475569', bg: '#f1f5f9', gradient: 'linear-gradient(145deg, #1e293b 0%, #475569 100%)' },
};

@Component({
  selector: 'lib-budget-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, SlicePipe, UpperCasePipe, AddExpenseModalComponent],
  template: `
    <div class="budget-page">

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Trip Budget</h1>
          @if (store.items().length > 0) {
            <div class="trip-stats">
              <span class="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                {{ store.items().length }} expense{{ store.items().length !== 1 ? 's' : '' }}
              </span>
              @if (totalSpent() > 0) {
                <span class="stat-pill stat-pill--green">
                  \${{ totalSpent() | number:'1.0-0' }} spent
                </span>
              }
            </div>
          }
        </div>
        <button class="btn-add" (click)="showModal.set(true)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Expense
        </button>
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
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.3"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
          <p class="empty-title">No expenses yet</p>
          <p class="empty-desc">Start tracking costs for flights, hotels, food and activities.</p>
          <button class="btn-add btn-add--lg" (click)="showModal.set(true)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add First Expense
          </button>
        </div>

      <!-- Cards -->
      } @else {
        <div class="cards-list">
          @for (item of store.items(); track item.id) {
            <div class="expense-card card">

              <!-- Left gradient panel -->
              <div class="card-panel" [style.background]="meta(item.category).gradient">
                @switch (item.category) {
                  @case ('TRANSPORT') {
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  }
                  @case ('FOOD') {
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
                  }
                  @case ('ACCOMMODATION') {
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  }
                  @case ('ACTIVITY') {
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  }
                  @default {
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  }
                }
              </div>

              <!-- Card body -->
              <div class="card-body">
                <div class="card-top-row">
                  <span class="category-badge" [style.color]="meta(item.category).color" [style.background]="meta(item.category).bg">
                    {{ meta(item.category).label }}
                  </span>
                  <span class="amount-badge">{{ +item.amount | currency }}</span>
                </div>
                <h3 class="card-name">{{ item.title }}</h3>
                <div class="card-meta-row">
                  <span class="meta-item">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {{ item.createdAt | date:'MMM d, y' }}
                  </span>
                  @if (item.paidByUserId) {
                    <span class="meta-dot"></span>
                    <span class="meta-item">
                      <div class="paidby-avatar">{{ memberName(item.paidByUserId) | slice:0:2 | uppercase }}</div>
                      {{ memberName(item.paidByUserId) }}
                    </span>
                  }
                </div>
              </div>

              <!-- Actions -->
              <div class="card-actions">
                <button class="btn-delete" (click)="store.deleteItem(item.id)" title="Remove">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Summary bar -->
        <div class="summary-bar">
          <div class="summary-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="summary-main">
            <span class="summary-eyebrow">TOTAL SPENT</span>
            <span class="summary-total">{{ totalSpent() | currency }}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-stats">
            <div class="summary-stat">
              <span class="summary-stat-label">EXPENSES</span>
              <span class="summary-stat-value">{{ store.items().length }}</span>
            </div>
            @for (entry of categoryBreakdown(); track entry.label) {
              <div class="summary-stat">
                <span class="summary-stat-label">{{ entry.label | uppercase }}</span>
                <span class="summary-stat-value" [style.color]="entry.color">{{ entry.total | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>

    @if (showModal()) {
      <lib-add-expense-modal (closed)="showModal.set(false)" />
    }
  `,
  styles: [`
    .budget-page { padding: var(--space-2) 0; }
    .header-left { display: flex; flex-direction: column; gap: 10px; }
    .trip-stats { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .stat-pill--green { color: #059669; background: #ecfdf5; }
    .cards-list { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }
    .expense-card { display: flex; flex-direction: row; position: relative; overflow: visible; transition: transform var(--transition-normal), box-shadow var(--transition-normal); }
    .expense-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.10); }
    .card-panel { width: 72px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 15px 0 0 15px; overflow: hidden; padding: var(--space-4) var(--space-2); }
    .card-body { flex: 1; padding: 16px 52px 16px 18px; display: flex; flex-direction: column; gap: 6px; }
    .card-top-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
    .category-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-3xl); font-size: 0.68rem; font-weight: var(--font-weight-bold); letter-spacing: var(--tracking-wide); }
    .amount-badge { font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text); background: var(--color-surface-subtle); border: 1px solid var(--color-border); padding: 3px 10px; border-radius: var(--radius-3xl); }
    .card-name { margin: 0; font-size: var(--font-size-card); font-weight: var(--font-weight-extrabold); color: var(--color-text); letter-spacing: var(--tracking-tight); line-height: 1.25; }
    .card-meta-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .meta-item { display: flex; align-items: center; gap: 4px; font-size: var(--font-size-caption); color: var(--color-text-subtle); }
    .meta-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--color-border); }
    .paidby-avatar { width: 18px; height: 18px; border-radius: 50%; background: var(--color-action-light); color: var(--color-action); font-size: 0.6rem; font-weight: var(--font-weight-bold); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .card-actions { position: absolute; top: 12px; right: 12px; display: flex; flex-direction: column; gap: 5px; opacity: 0; transition: opacity var(--transition-fast); }
    .expense-card:hover .card-actions { opacity: 1; }
    .btn-delete { width: 28px; height: 28px; border-radius: var(--radius-xs); background: var(--color-surface-muted); border: none; display: flex; align-items: center; justify-content: center; color: var(--color-text-dim); cursor: pointer; transition: background var(--transition-fast), color var(--transition-fast); }
    .btn-delete:hover { background: var(--color-danger-light); color: var(--color-danger); }
    .skeleton-card { height: 90px; border-radius: var(--radius-2xl); }
    .summary-bar { display: flex; align-items: center; gap: var(--space-5); background: var(--color-dark-bg); border-radius: var(--radius-2xl); padding: 22px var(--space-7); margin-top: var(--space-2); color: white; }
    .summary-icon-wrap { width: 42px; height: 42px; border-radius: 10px; background: rgba(99,102,241,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .summary-main { display: flex; flex-direction: column; gap: 3px; }
    .summary-eyebrow { font-size: 0.65rem; font-weight: var(--font-weight-semibold); letter-spacing: var(--tracking-widest); color: var(--color-text-soft); text-transform: uppercase; }
    .summary-total { font-size: var(--font-size-xl); font-weight: var(--font-weight-extrabold); color: white; }
    .summary-divider { width: 1px; background: var(--color-dark-surface); align-self: stretch; flex-shrink: 0; }
    .summary-stats { display: flex; gap: 32px; margin-left: 4px; flex-wrap: wrap; }
    .summary-stat { display: flex; flex-direction: column; gap: 3px; }
    .summary-stat-label { font-size: 0.65rem; font-weight: var(--font-weight-semibold); letter-spacing: var(--tracking-widest); color: var(--color-text-soft); text-transform: uppercase; }
    .summary-stat-value { font-size: 1.1rem; font-weight: var(--font-weight-bold); color: white; }
    @media (max-width: 600px) {
      .card-panel { width: 56px; }
      .summary-bar { flex-wrap: wrap; gap: 14px; }
      .page-header { margin-bottom: 18px; align-items: center; gap: 10px; }
      .page-title { font-size: 1.1rem; }
      .btn-add { padding: var(--space-2) var(--space-3); font-size: 0.8rem; gap: 5px; }
      .summary-stats { gap: 16px; }
    }
  `],
})
export class BudgetPageComponent {
  readonly store = inject(BudgetStore);
  private readonly membersStore = inject(TripMembersStore);
  readonly showModal = signal(false);

  memberName(userId: string): string {
    const member = this.membersStore.members().find((m) => m.userId === userId);
    return member?.user.name || member?.user.email || userId;
  }

  meta(category: string) {
    return CATEGORY_META[category] ?? CATEGORY_META['OTHER'];
  }

  totalSpent(): number {
    return this.store.items().reduce((sum, i) => sum + Number(i.amount), 0);
  }

  categoryBreakdown(): { label: string; color: string; total: number }[] {
    const map: Record<string, number> = {};
    for (const item of this.store.items()) {
      map[item.category] = (map[item.category] ?? 0) + Number(item.amount);
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, total]) => ({
        label: CATEGORY_META[cat]?.label ?? cat,
        color: CATEGORY_META[cat]?.color ?? 'white',
        total,
      }));
  }
}
