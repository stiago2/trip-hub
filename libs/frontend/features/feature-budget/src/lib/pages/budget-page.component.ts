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
      <div class="table-card">
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
    .budget-page { padding: 8px 0; }

    .page-header { margin-bottom: 20px; }
    .page-title { margin: 0 0 2px; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
    .page-subtitle { margin: 0; font-size: 0.85rem; color: #94a3b8; }

    /* Table card */
    .table-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      overflow: hidden;
    }
    .table-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 20px;
      border-bottom: 1px solid #f1f5f9;
    }
    .table-title { font-size: 0.9rem; font-weight: 700; color: #0f172a; }

    .btn-add {
      display: flex; align-items: center; gap: 6px;
      background: #3b82f6; color: white; border: none;
      padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 500;
    }
    .btn-add:hover { background: #2563eb; }

    .state-msg { color: #64748b; padding: 20px; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 40px 20px;
    }
    .empty-text { margin: 0; font-size: 0.9rem; color: #94a3b8; }
    .btn-add-inline {
      background: none; border: none; color: #3b82f6; font-size: 0.85rem;
      cursor: pointer; padding: 4px 8px; border-radius: 6px;
    }
    .btn-add-inline:hover { background: #eff6ff; }

    /* Table */
    .expense-table { width: 100%; border-collapse: collapse; }
    .expense-table thead th {
      padding: 10px 16px;
      text-align: left;
      font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
      color: #94a3b8;
      background: #f8fafc;
      border-bottom: 1px solid #f1f5f9;
    }
    .expense-row td { padding: 14px 16px; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
    .expense-row:last-child td { border-bottom: none; }
    .expense-row:hover td { background: #fafbfd; }

    .col-name { font-size: 0.9rem; font-weight: 500; color: #1e293b; }

    .category-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .col-amount { font-size: 0.95rem; font-weight: 700; color: #0f172a; }

    .col-date { font-size: 0.82rem; color: #64748b; }

    .paidby-cell { display: flex; align-items: center; gap: 8px; }
    .paidby-avatar {
      width: 26px; height: 26px; border-radius: 50%;
      background: #eff6ff; color: #3b82f6;
      font-size: 0.7rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .paidby-name { font-size: 0.85rem; color: #334155; }
    .paidby-none { color: #cbd5e1; font-size: 0.85rem; }

    .col-action { width: 40px; text-align: center; }
    .btn-action {
      background: none; border: none; color: #cbd5e1; cursor: pointer;
      padding: 4px; border-radius: 6px; display: inline-flex; align-items: center;
      transition: color 0.15s, background 0.15s;
    }
    .btn-action:hover { color: #ef4444; background: #fef2f2; }
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
