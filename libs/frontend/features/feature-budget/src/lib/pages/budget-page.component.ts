import { CurrencyPipe, DatePipe, SlicePipe, UpperCasePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { BudgetStore } from '../store/budget.store';
import { AddExpenseModalComponent } from '../components/add-expense-modal/add-expense-modal.component';
import { TripMembersStore } from '@org/feature-trip-members';

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  TRANSPORT:     { label: 'Transport',     color: '#1d4ed8', bg: '#dbeafe' },
  FOOD:          { label: 'Food',          color: '#b45309', bg: '#fef3c7' },
  ACCOMMODATION: { label: 'Hotel',         color: '#7c3aed', bg: '#ede9fe' },
  ACTIVITY:      { label: 'Activity',      color: '#059669', bg: '#d1fae5' },
  OTHER:         { label: 'Other',         color: '#64748b', bg: '#f1f5f9' },
};

@Component({
  selector: 'lib-budget-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, SlicePipe, UpperCasePipe, AddExpenseModalComponent],
  template: `
    <div class="budget-page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Trip Budget</h2>
          <p class="page-subtitle">Track and manage trip expenses</p>
        </div>
      </div>

      <!-- Expenses table -->
      <div class="table-card card">
        <div class="table-header">
          <span class="table-title">Detailed Expenses</span>
          <button class="btn-add" (click)="showModal.set(true)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Expense
          </button>
        </div>

        @if (store.loading()) {
          <p class="state-msg">Loading...</p>
        } @else if (store.items().length === 0) {
          <div class="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            <p class="empty-text">No expenses yet.</p>
            <button class="btn-add-inline" (click)="showModal.set(true)">Add your first expense</button>
          </div>
        } @else {
          <table class="expense-table">
            <thead>
              <tr>
                <th>Expense Name</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Paid By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of store.items(); track item.id) {
                <tr class="expense-row">
                  <td class="col-name">{{ item.title }}</td>
                  <td class="col-category">
                    <span
                      class="category-badge"
                      [style.color]="categoryMeta(item.category).color"
                      [style.background]="categoryMeta(item.category).bg"
                    >{{ categoryMeta(item.category).label }}</span>
                  </td>
                  <td class="col-amount">{{ +item.amount | currency }}</td>
                  <td class="col-date">{{ item.createdAt | date:'MMM d, y' }}</td>
                  <td class="col-paidby">
                    @if (item.paidByUserId) {
                      <div class="paidby-cell">
                        <div class="paidby-avatar">{{ memberName(item.paidByUserId) | slice:0:2 | uppercase }}</div>
                        <span class="paidby-name">{{ memberName(item.paidByUserId) }}</span>
                      </div>
                    } @else {
                      <span class="paidby-none">—</span>
                    }
                  </td>
                  <td class="col-action">
                    <button class="btn-action" (click)="store.deleteItem(item.id)" title="Remove">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>

    @if (showModal()) {
      <lib-add-expense-modal (closed)="showModal.set(false)" />
    }
  `,
  styles: [`
    .budget-page { padding: var(--space-2) 0; }

    .page-subtitle { margin: 0; font-size: 0.85rem; color: var(--color-text-subtle); }

    /* Table card */
    .table-card {
      border-radius: var(--radius-xl);
      overflow: hidden;
    }
    .table-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px var(--space-5);
      border-bottom: 1px solid var(--color-surface-muted);
    }
    .table-title { font-size: 0.9rem; font-weight: var(--font-weight-bold); color: var(--color-text); }

    .state-msg { color: var(--color-text-soft); padding: var(--space-5); }

    .empty-text { margin: 0; font-size: 0.9rem; color: var(--color-text-subtle); }
    .btn-add-inline {
      background: none; border: none; color: var(--color-action); font-size: 0.85rem;
      cursor: pointer; padding: 4px var(--space-2); border-radius: 6px;
    }
    .btn-add-inline:hover { background: var(--color-action-light); }

    /* Table */
    .expense-table { width: 100%; border-collapse: collapse; }
    .expense-table thead th {
      padding: 10px var(--space-4);
      text-align: left;
      font-size: 0.72rem; font-weight: var(--font-weight-semibold); text-transform: uppercase; letter-spacing: var(--tracking-open);
      color: var(--color-text-subtle);
      background: var(--color-surface-subtle);
      border-bottom: 1px solid var(--color-surface-muted);
    }
    .expense-row td { padding: 14px var(--space-4); border-bottom: 1px solid var(--color-surface-subtle); vertical-align: middle; }
    .expense-row:last-child td { border-bottom: none; }
    .expense-row:hover td { background: #fafbfd; }

    .col-name { font-size: 0.9rem; font-weight: var(--font-weight-medium); color: var(--color-dark-surface); }

    .category-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: var(--font-weight-semibold);
    }

    .col-amount { font-size: 0.95rem; font-weight: var(--font-weight-bold); color: var(--color-text); }

    .col-date { font-size: 0.82rem; color: var(--color-text-soft); }

    .paidby-cell { display: flex; align-items: center; gap: var(--space-2); }
    .paidby-avatar {
      width: 26px; height: 26px; border-radius: 50%;
      background: var(--color-action-light); color: var(--color-action);
      font-size: var(--font-size-2xs); font-weight: var(--font-weight-bold);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .paidby-name { font-size: 0.85rem; color: var(--color-text-body); }
    .paidby-none { color: var(--color-text-dim); font-size: 0.85rem; }

    .col-action { width: 40px; text-align: center; }
    .btn-action {
      background: none; border: none; color: var(--color-text-dim); cursor: pointer;
      padding: 4px; border-radius: 6px; display: inline-flex; align-items: center;
      transition: color var(--transition-fast), background var(--transition-fast);
    }
    .btn-action:hover { color: var(--color-danger); background: var(--color-danger-light); }

    /* ── Mobile: card layout ── */
    @media (max-width: 600px) {
      .page-title { font-size: 1.1rem; }
      .table-header { padding: 14px var(--space-4); }

      /* Hide table entirely, render rows as cards */
      .expense-table thead { display: none; }
      .expense-table, .expense-table tbody { display: block; }

      .expense-row {
        display: grid;
        grid-template-areas:
          "name   name   action"
          "cat    amount amount"
          "date   date   date";
        grid-template-columns: auto 1fr auto;
        column-gap: 10px; row-gap: 4px;
        padding: 14px var(--space-4);
        border-bottom: 1px solid var(--color-surface-muted);
      }
      .expense-row:hover td { background: none; }

      .col-name   { grid-area: name;   font-size: 0.88rem; font-weight: var(--font-weight-semibold); padding: 0; border: 0; align-self: center; }
      .col-category { grid-area: cat;  padding: 0; border: 0; align-self: center; }
      .col-amount { grid-area: amount; padding: 0; border: 0; text-align: right; align-self: center; font-size: 1rem; }
      .col-date   { grid-area: date;   padding: 0; border: 0; font-size: 0.75rem; color: var(--color-text-subtle); }
      .col-paidby { display: none; }
      .col-action { grid-area: action; padding: 0; border: 0; align-self: center; width: auto; }

      .btn-action { color: var(--color-border); opacity: 1; }
    }
  `],
})
export class BudgetPageComponent  {
  readonly store = inject(BudgetStore);
  private readonly membersStore = inject(TripMembersStore);

  readonly showModal = signal(false);


  memberName(userId: string): string {
    const member = this.membersStore.members().find((m) => m.userId === userId);
    return member?.user.name || member?.user.email || userId;
  }

  categoryMeta(category: string): { label: string; color: string; bg: string } {
    return CATEGORY_META[category] ?? CATEGORY_META['OTHER'];
  }

}
