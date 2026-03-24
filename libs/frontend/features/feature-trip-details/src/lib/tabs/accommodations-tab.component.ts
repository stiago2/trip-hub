import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Accommodation } from '@org/data-access-trips';
import { DestinationsStore } from '@org/feature-destinations';
import { AddAccommodationModalComponent } from '../components/add-accommodation-modal/add-accommodation-modal.component';
import { AccommodationsStore } from '../store/accommodations.store';

const CITY_GRADIENTS: Record<string, string> = {
  paris:     'linear-gradient(145deg, #1a2a4a 0%, #2d4a8a 100%)',
  rome:      'linear-gradient(145deg, #2a1a0a 0%, #8a4a1a 100%)',
  barcelona: 'linear-gradient(145deg, #0a2a1a 0%, #1a6a4a 100%)',
  london:    'linear-gradient(145deg, #1a1a2a 0%, #4a4a8a 100%)',
  tokyo:     'linear-gradient(145deg, #2a0a1a 0%, #8a1a4a 100%)',
  new:       'linear-gradient(145deg, #0a1a2a 0%, #1a3a6a 100%)',
  default:   'linear-gradient(145deg, #1e293b 0%, #334155 100%)',
};

@Component({
  selector: 'lib-accommodations-tab',
  standalone: true,
  imports: [AddAccommodationModalComponent, CurrencyPipe, DatePipe, DecimalPipe],
  template: `
    <div class="acc-page">

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Accommodations</h1>
          @if (store.items().length > 0) {
            <div class="trip-stats">
              <span class="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                {{ store.items().length }} stay{{ store.items().length !== 1 ? 's' : '' }}
              </span>
              @if (store.totalNights() > 0) {
                <span class="stat-pill stat-pill--indigo">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {{ store.totalNights() }} night{{ store.totalNights() !== 1 ? 's' : '' }}
                </span>
              }
              @if (store.grandTotal() > 0) {
                <span class="stat-pill stat-pill--green">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  \${{ store.grandTotal() | number:'1.0-0' }} total
                </span>
              }
            </div>
          }
        </div>
        <button class="btn-add" (click)="showModal.set(true)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Booking
        </button>
      </div>

      <!-- Loading -->
      @if (store.loading()) {
        <div class="cards-list">
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-card shimmer"></div>
          }
        </div>

      <!-- Empty -->
      } @else if (store.items().length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.3">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <p class="empty-title">No stays booked yet</p>
          <p class="empty-desc">Add hotels, apartments or any accommodation for your trip.</p>
          <button class="btn-add btn-add--lg" (click)="showModal.set(true)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add First Stay
          </button>
        </div>

      <!-- Cards -->
      } @else {
        <div class="cards-list">
          @for (item of store.items(); track item.id) {
            <div class="acc-card card">

              <!-- Left gradient panel -->
              <div class="card-panel" [style.background]="cityGradient(destinationCity(item.destinationId))">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                @if (nights(item) > 0) {
                  <span class="panel-nights">{{ nights(item) }}N</span>
                }
              </div>

              <!-- Card body -->
              <div class="card-body">
                <div class="card-top-row">
                  <span class="dest-badge">{{ destinationLabel(item.destinationId) }}</span>
                  @if (item.price != null) {
                    <span class="price-badge">{{ item.price | currency:'USD':'symbol':'1.0-0' }}</span>
                  }
                </div>

                <h3 class="card-name">{{ item.name }}</h3>

                @if (item.address) {
                  <p class="card-address">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {{ item.address }}
                  </p>
                }

                <div class="dates-row">
                  <div class="date-block">
                    <span class="date-label">CHECK-IN</span>
                    <span class="date-value">{{ item.checkIn | date:'MMM d, y' }}</span>
                  </div>
                  <div class="date-arrow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>
                    </svg>
                  </div>
                  <div class="date-block">
                    <span class="date-label">CHECK-OUT</span>
                    <span class="date-value">{{ item.checkOut | date:'MMM d, y' }}</span>
                  </div>
                </div>
              </div>

              <!-- Card actions -->
              <div class="card-actions">
                <button class="btn-edit" (click)="openEdit(item)" title="Edit">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="btn-delete" (click)="store.removeItem(item.id)" title="Remove">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Summary bar -->
        <div class="summary-bar">
          <div class="summary-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div class="summary-main">
            <span class="summary-eyebrow">ACCOMMODATION BUDGET</span>
            <span class="summary-total">{{ store.grandTotal() | currency }}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-stats">
            <div class="summary-stat">
              <span class="summary-stat-label">STAYS</span>
              <span class="summary-stat-value">{{ store.items().length }}</span>
            </div>
            @if (store.totalNights() > 0) {
              <div class="summary-stat">
                <span class="summary-stat-label">TOTAL NIGHTS</span>
                <span class="summary-stat-value">{{ store.totalNights() }}</span>
              </div>
            }
            @if (store.grandTotal() > 0) {
              <div class="summary-stat">
                <span class="summary-stat-label">AVG / NIGHT</span>
                <span class="summary-stat-value summary-stat-value--blue">
                  {{ store.totalNights() > 0 ? (store.grandTotal() / store.totalNights() | currency:'USD':'symbol':'1.0-0') : '—' }}
                </span>
              </div>
            }
          </div>
        </div>
      }

    </div>

    @if (showModal()) {
      <lib-add-accommodation-modal
        [destinations]="destinationsStore.destinations()"
        [accommodation]="editingAccommodation()"
        (closed)="showModal.set(false); editingAccommodation.set(null)"
      />
    }
  `,
  styles: [`
    .acc-page { padding: var(--space-2) 0; }

    /* ── Header ── */
    .header-left { display: flex; flex-direction: column; gap: 10px; }

    .trip-stats { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .stat-pill--indigo { color: #6366f1; background: #eef2ff; }
    .stat-pill--green  { color: #059669; background: #ecfdf5; }

    /* ── Cards list ── */
    .cards-list { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }

    /* ── Accommodation card ── */
    .acc-card {
      display: flex; flex-direction: row;
      position: relative; overflow: visible;
      transition: transform var(--transition-normal), box-shadow var(--transition-normal);
    }
    .acc-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.10); }

    /* Left gradient panel */
    .card-panel {
      width: 82px; flex-shrink: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
      border-radius: 15px 0 0 15px; overflow: hidden;
      padding: var(--space-5) var(--space-2);
    }
    .panel-nights {
      font-size: 0.65rem; font-weight: var(--font-weight-extrabold); letter-spacing: var(--tracking-wider);
      color: rgba(255,255,255,0.8);
    }

    /* Card body */
    .card-body {
      flex: 1; padding: 18px 52px 18px 18px;
      display: flex; flex-direction: column; gap: 7px;
    }

    .card-top-row {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-2);
    }
    .dest-badge {
      display: inline-block; padding: 3px 9px; border-radius: var(--radius-3xl);
      font-size: 0.68rem; font-weight: var(--font-weight-bold); letter-spacing: var(--tracking-wide);
      color: #0369a1; background: #e0f2fe;
    }
    .price-badge {
      font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text);
      background: var(--color-surface-subtle); border: 1px solid var(--color-border);
      padding: 3px 10px; border-radius: var(--radius-3xl);
    }

    .card-name {
      margin: 0; font-size: var(--font-size-card); font-weight: var(--font-weight-extrabold);
      color: var(--color-text); letter-spacing: var(--tracking-tight); line-height: 1.25;
    }

    .card-address {
      margin: 0; display: flex; align-items: center; gap: 4px;
      font-size: var(--font-size-caption); color: var(--color-text-subtle);
    }

    /* Dates */
    .dates-row {
      display: flex; align-items: center; gap: 10px; margin-top: 2px;
    }
    .date-block { display: flex; flex-direction: column; gap: 2px; }
    .date-label { font-size: 0.65rem; font-weight: var(--font-weight-semibold); letter-spacing: var(--tracking-wide); color: var(--color-text-subtle); text-transform: uppercase; }
    .date-value { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--color-text-body); }
    .date-arrow { display: flex; align-items: center; flex-shrink: 0; padding-top: 12px; }

    /* Action buttons */
    .card-actions {
      position: absolute; top: 12px; right: 12px;
      display: flex; flex-direction: column; gap: 5px;
      opacity: 0; transition: opacity var(--transition-fast);
    }
    .acc-card:hover .card-actions { opacity: 1; }

    .btn-edit, .btn-delete {
      width: 28px; height: 28px; border-radius: var(--radius-xs);
      background: var(--color-surface-muted); border: none;
      display: flex; align-items: center; justify-content: center;
      color: var(--color-text-dim); cursor: pointer;
      transition: background var(--transition-fast), color var(--transition-fast);
    }
    .btn-edit:hover { background: var(--color-action-light); color: var(--color-action); }
    .btn-delete:hover { background: var(--color-danger-light); color: var(--color-danger); }

    /* ── Skeleton ── */
    .skeleton-card { height: 100px; border-radius: var(--radius-2xl); }

    /* ── Summary bar ── */
    .summary-bar {
      display: flex; align-items: center; gap: var(--space-5);
      background: var(--color-dark-bg); border-radius: var(--radius-2xl); padding: 22px var(--space-7);
      margin-top: var(--space-2); color: white;
    }
    .summary-icon-wrap {
      width: 42px; height: 42px; border-radius: 10px;
      background: rgba(59,130,246,0.2);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .summary-main { display: flex; flex-direction: column; gap: 3px; }
    .summary-eyebrow { font-size: 0.65rem; font-weight: var(--font-weight-semibold); letter-spacing: var(--tracking-widest); color: var(--color-text-soft); text-transform: uppercase; }
    .summary-total { font-size: var(--font-size-xl); font-weight: var(--font-weight-extrabold); color: white; }
    .summary-divider { width: 1px; background: var(--color-dark-surface); align-self: stretch; flex-shrink: 0; }
    .summary-stats { display: flex; gap: 32px; margin-left: 4px; flex-wrap: wrap; }
    .summary-stat { display: flex; flex-direction: column; gap: 3px; }
    .summary-stat-label { font-size: 0.65rem; font-weight: var(--font-weight-semibold); letter-spacing: var(--tracking-widest); color: var(--color-text-soft); text-transform: uppercase; }
    .summary-stat-value { font-size: 1.1rem; font-weight: var(--font-weight-bold); color: white; }
    .summary-stat-value--blue { color: var(--color-action); }

    @media (max-width: 600px) {
      .card-panel { width: 60px; }
      .summary-bar { flex-wrap: wrap; gap: 14px; }
      .page-header { margin-bottom: 18px; align-items: center; gap: 10px; }
      .page-title { font-size: 1.1rem; }
      .btn-add { padding: var(--space-2) var(--space-3); font-size: 0.8rem; gap: 5px; }
    }
  `],
})
export class AccommodationsTabComponent {
  readonly store = inject(AccommodationsStore);
  readonly destinationsStore = inject(DestinationsStore);

  readonly showModal = signal(false);
  readonly editingAccommodation = signal<Accommodation | null>(null);

  openEdit(item: Accommodation): void {
    this.editingAccommodation.set(item);
    this.showModal.set(true);
  }

  nights(item: import('@org/data-access-trips').Accommodation): number {
    if (!item.checkIn || !item.checkOut) return 0;
    const diff = new Date(item.checkOut).getTime() - new Date(item.checkIn).getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  }

  destinationCity(destinationId: string): string {
    return this.destinationsStore.destinations().find((d) => d.id === destinationId)?.city ?? '';
  }

  destinationLabel(destinationId: string): string {
    const d = this.destinationsStore.destinations().find((d) => d.id === destinationId);
    return d ? `${d.city}, ${d.country}` : 'Unknown';
  }

  cityGradient(city: string): string {
    const key = city.toLowerCase().split(' ')[0];
    return CITY_GRADIENTS[key] ?? CITY_GRADIENTS['default'];
  }

}
