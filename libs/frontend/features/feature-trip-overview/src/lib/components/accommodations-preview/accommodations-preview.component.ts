import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AccommodationApiService, Accommodation } from '@org/data-access-trips';

@Component({
  selector: 'lib-accommodations-preview',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="preview-card">
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
      margin-bottom: 16px; padding-bottom: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .card-title { font-size: 0.875rem; font-weight: 700; color: #0f172a; }
    .card-link {
      font-size: 0.775rem; font-weight: 600; color: #3b82f6;
      text-decoration: none; padding: 3px 8px; border-radius: 6px;
      background: #eff6ff; transition: background 0.15s;
    }
    .card-link:hover { background: #dbeafe; }

    /* Skeletons */
    .skeleton-list { display: flex; flex-direction: column; gap: 10px; }
    .skeleton-item { display: flex; align-items: center; gap: 10px; }
    .skeleton-icon { width: 32px; height: 32px; border-radius: 8px; background: #f1f5f9; flex-shrink: 0; }
    .skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .skeleton-line {
      height: 10px; border-radius: 5px; background: #f1f5f9;
      animation: shimmer 1.2s infinite linear;
    }
    .skeleton-line--short { width: 55%; }
    @keyframes shimmer {
      0%   { background-color: #f1f5f9; }
      50%  { background-color: #e2e8f0; }
      100% { background-color: #f1f5f9; }
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 0 8px;
    }
    .empty-icon-wrap {
      width: 52px; height: 52px; border-radius: 14px;
      background: #f8fafc;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
    }
    .empty-title { margin: 0; font-size: 0.875rem; color: #64748b; font-weight: 600; }
    .btn-add {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 4px;
      background: #f8fafc;
      color: #475569;
      text-decoration: none;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .btn-add:hover { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }

    /* Items list */
    .items-list { display: flex; flex-direction: column; gap: 8px; }
    .acc-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px;
      border-radius: 10px;
      background: #f8fafc;
    }
    .acc-icon-wrap {
      width: 32px; height: 32px; border-radius: 8px;
      background: #eff6ff;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .acc-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .acc-name { font-size: 0.83rem; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .acc-dates { font-size: 0.75rem; color: #64748b; }
    .acc-price { font-size: 0.82rem; font-weight: 700; color: #0f172a; white-space: nowrap; }

    /* Summary */
    .summary-row {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 12px; padding-top: 12px;
      border-top: 1px solid #f1f5f9;
    }
    .summary-label { font-size: 0.78rem; color: #64748b; }
    .summary-amount { font-size: 0.82rem; font-weight: 700; color: #0f172a; }
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
