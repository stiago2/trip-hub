import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AccommodationApiService, Accommodation } from '@org/data-access-trips';

@Component({
  selector: 'lib-accommodations-preview',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="preview-card card">
      <div class="card-header">
        <span class="card-title">Accommodations</span>
        <a class="card-link" [routerLink]="['/trips', tripId(), 'accommodations']">Manage</a>
      </div>

      @if (loading()) {
        <div class="skeleton-list">
          @for (i of [1,2]; track i) {
            <div class="skeleton-item">
              <div class="skeleton-icon"></div>
              <div class="skeleton-lines">
                <div class="skeleton-line"></div>
                <div class="skeleton-line skeleton-line--short"></div>
              </div>
            </div>
          }
        </div>
      }

      @if (!loading() && items().length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <p class="empty-title">No accommodations added</p>
          <a class="btn-add" [routerLink]="['/trips', tripId(), 'accommodations']">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add stay
          </a>
        </div>
      }

      @if (!loading() && items().length > 0) {
        <div class="items-list">
          @for (item of items(); track item.id) {
            <div class="acc-item">
              <div class="acc-icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div class="acc-info">
                <span class="acc-name">{{ item.name }}</span>
                <span class="acc-dates">
                  {{ item.checkIn | date:'MMM d' }} – {{ item.checkOut | date:'MMM d' }}
                </span>
              </div>
              @if (item.price != null) {
                <span class="acc-price">\${{ item.price | number:'1.0-0' }}</span>
              }
            </div>
          }
        </div>

        @if (total() > 0) {
          <div class="summary-row">
            <span class="summary-label">{{ items().length }} stay{{ items().length > 1 ? 's' : '' }}</span>
            <span class="summary-amount">\${{ total() | number:'1.0-2' }} total</span>
          </div>
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
      margin-bottom: var(--space-4); padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--color-surface-muted);
    }
    .card-title { font-size: var(--font-size-body); font-weight: var(--font-weight-bold); color: var(--color-text); }
    .card-link {
      font-size: 0.775rem; font-weight: var(--font-weight-semibold); color: var(--color-action);
      text-decoration: none; padding: 3px 8px; border-radius: 6px;
      background: var(--color-action-light); transition: background var(--transition-fast);
    }
    .card-link:hover { background: #dbeafe; }

    /* Skeletons */
    .skeleton-list { display: flex; flex-direction: column; gap: 10px; }
    .skeleton-item { display: flex; align-items: center; gap: 10px; }
    .skeleton-icon { width: 32px; height: 32px; border-radius: var(--radius-md); background: var(--color-surface-muted); flex-shrink: 0; }
    .skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .skeleton-line {
      height: 10px; border-radius: 5px; background: var(--color-surface-muted);
      animation: shimmer 1.2s infinite linear;
    }
    .skeleton-line--short { width: 55%; }
    @keyframes shimmer {
      0%   { background-color: var(--color-surface-muted); }
      50%  { background-color: var(--color-border); }
      100% { background-color: var(--color-surface-muted); }
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-4) 0 var(--space-2);
    }
    .empty-icon-wrap {
      width: 52px; height: 52px; border-radius: 14px;
      background: var(--color-surface-subtle);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
    }
    .empty-title { margin: 0; font-size: var(--font-size-body); color: var(--color-text-soft); font-weight: var(--font-weight-semibold); }
    .btn-add {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 4px;
      background: var(--color-surface-subtle);
      color: #475569;
      text-decoration: none;
      font-size: 0.8rem;
      font-weight: var(--font-weight-semibold);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
    }
    .btn-add:hover { background: var(--color-action-light); border-color: #bfdbfe; color: var(--color-action-hover); }

    /* Items list */
    .items-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .acc-item {
      display: flex; align-items: center; gap: 10px;
      padding: var(--space-2) 10px;
      border-radius: var(--radius-lg);
      background: var(--color-surface-subtle);
    }
    .acc-icon-wrap {
      width: 32px; height: 32px; border-radius: var(--radius-md);
      background: var(--color-action-light);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .acc-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .acc-name { font-size: 0.83rem; font-weight: var(--font-weight-semibold); color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .acc-dates { font-size: 0.75rem; color: var(--color-text-soft); }
    .acc-price { font-size: 0.82rem; font-weight: var(--font-weight-bold); color: var(--color-text); white-space: nowrap; }

    /* Summary */
    .summary-row {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: var(--space-3); padding-top: var(--space-3);
      border-top: 1px solid var(--color-surface-muted);
    }
    .summary-label { font-size: var(--font-size-caption); color: var(--color-text-soft); }
    .summary-amount { font-size: 0.82rem; font-weight: var(--font-weight-bold); color: var(--color-text); }
  `],
})
export class AccommodationsPreviewComponent {
  private readonly api = inject(AccommodationApiService);

  readonly tripId = input('');

  readonly loading = signal(false);
  private readonly _items = signal<Accommodation[]>([]);
  readonly items = this._items.asReadonly();

  readonly total = computed(() =>
    this._items().reduce((sum, i) => sum + (i.price != null ? Number(i.price) : 0), 0)
  );

  constructor() {
    effect(() => {
      const id = this.tripId();
      if (!id) return;
      this.loading.set(true);
      this.api.getAccommodationsByTrip(id).subscribe({
        next: (data) => { this._items.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    });
  }
}
