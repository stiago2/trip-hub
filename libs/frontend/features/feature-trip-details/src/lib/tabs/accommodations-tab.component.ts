import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { CreateAccommodationPayload } from '@org/data-access-trips';
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
            <div class="acc-card">

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

              <!-- Remove button -->
              <button class="btn-delete" (click)="store.removeItem(item.id)" title="Remove">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
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
        (closed)="showModal.set(false)"
        (submitted)="onAccommodationSubmitted($event)"
      />
    }
  `,
  styles: [`
    .acc-page { padding: 8px 0; }

    /* ── Header ── */
    .page-header {
      display: flex; justify-content: space-between;
      align-items: flex-start; margin-bottom: 28px; gap: 16px;
    }
    .header-left { display: flex; flex-direction: column; gap: 10px; }
    .page-title { margin: 0; font-size: 1.35rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }

    .trip-stats { display: flex; gap: 8px; flex-wrap: wrap; }
    .stat-pill {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.78rem; font-weight: 600; color: #3b82f6;
      background: #eff6ff; padding: 4px 10px; border-radius: 20px;
    }
    .stat-pill--indigo { color: #6366f1; background: #eef2ff; }
    .stat-pill--green  { color: #059669; background: #ecfdf5; }

    .btn-add {
      display: flex; align-items: center; gap: 7px;
      background: #3b82f6; color: white; border: none;
      padding: 10px 18px; border-radius: 10px;
      font-size: 0.875rem; font-weight: 600; white-space: nowrap;
      cursor: pointer; flex-shrink: 0;
      transition: background 0.15s, transform 0.15s;
    }
    .btn-add:hover { background: #2563eb; transform: translateY(-1px); }
    .btn-add--lg { padding: 12px 22px; }

    /* ── Empty state ── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 10px; padding: 80px 24px; text-align: center;
    }
    .empty-icon-wrap {
      width: 72px; height: 72px; border-radius: 20px; background: #f1f5f9;
      display: flex; align-items: center; justify-content: center; margin-bottom: 8px;
    }
    .empty-title { margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a; }
    .empty-desc { margin: 0; font-size: 0.875rem; color: #94a3b8; max-width: 300px; }

    /* ── Cards list ── */
    .cards-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }

    /* ── Accommodation card ── */
    .acc-card {
      background: white; border: 1px solid #e8edf3; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
      display: flex; flex-direction: row;
      position: relative; overflow: visible;
      transition: transform 0.18s, box-shadow 0.18s;
    }
    .acc-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.10); }

    /* Left gradient panel */
    .card-panel {
      width: 82px; flex-shrink: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
      border-radius: 15px 0 0 15px; overflow: hidden;
      padding: 20px 8px;
    }
    .panel-nights {
      font-size: 0.65rem; font-weight: 800; letter-spacing: 0.08em;
      color: rgba(255,255,255,0.8);
    }

    /* Card body */
    .card-body {
      flex: 1; padding: 18px 52px 18px 18px;
      display: flex; flex-direction: column; gap: 7px;
    }

    .card-top-row {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .dest-badge {
      display: inline-block; padding: 3px 9px; border-radius: 20px;
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.07em;
      color: #0369a1; background: #e0f2fe;
    }
    .price-badge {
      font-size: 0.82rem; font-weight: 800; color: #0f172a;
      background: #f8fafc; border: 1px solid #e2e8f0;
      padding: 3px 10px; border-radius: 20px;
    }

    .card-name {
      margin: 0; font-size: 1.05rem; font-weight: 800;
      color: #0f172a; letter-spacing: -0.02em; line-height: 1.25;
    }

    .card-address {
      margin: 0; display: flex; align-items: center; gap: 4px;
      font-size: 0.78rem; color: #94a3b8;
    }

    /* Dates */
    .dates-row {
      display: flex; align-items: center; gap: 10px; margin-top: 2px;
    }
    .date-block { display: flex; flex-direction: column; gap: 2px; }
    .date-label { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.07em; color: #94a3b8; text-transform: uppercase; }
    .date-value { font-size: 0.82rem; font-weight: 700; color: #334155; }
    .date-arrow { display: flex; align-items: center; flex-shrink: 0; padding-top: 12px; }

    /* Remove button */
    .btn-delete {
      position: absolute; top: 12px; right: 12px;
      width: 28px; height: 28px; border-radius: 7px;
      background: #f1f5f9; border: none;
      display: flex; align-items: center; justify-content: center;
      color: #cbd5e1; cursor: pointer;
      opacity: 0; transition: opacity 0.15s, background 0.15s, color 0.15s;
    }
    .acc-card:hover .btn-delete { opacity: 1; }
    .btn-delete:hover { background: #fef2f2; color: #ef4444; }

    /* ── Skeleton ── */
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .shimmer {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%; animation: shimmer 1.4s ease infinite;
    }
    .skeleton-card { height: 100px; border-radius: 16px; }

    /* ── Summary bar ── */
    .summary-bar {
      display: flex; align-items: center; gap: 20px;
      background: #0f172a; border-radius: 16px; padding: 22px 28px;
      margin-top: 8px; color: white;
    }
    .summary-icon-wrap {
      width: 42px; height: 42px; border-radius: 10px;
      background: rgba(59,130,246,0.2);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .summary-main { display: flex; flex-direction: column; gap: 3px; }
    .summary-eyebrow { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; color: #64748b; text-transform: uppercase; }
    .summary-total { font-size: 1.35rem; font-weight: 800; color: white; }
    .summary-divider { width: 1px; background: #1e293b; align-self: stretch; flex-shrink: 0; }
    .summary-stats { display: flex; gap: 32px; margin-left: 4px; flex-wrap: wrap; }
    .summary-stat { display: flex; flex-direction: column; gap: 3px; }
    .summary-stat-label { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; color: #64748b; text-transform: uppercase; }
    .summary-stat-value { font-size: 1.1rem; font-weight: 700; color: white; }
    .summary-stat-value--blue { color: #3b82f6; }

    @media (max-width: 600px) {
      .card-panel { width: 60px; }
      .summary-bar { flex-wrap: wrap; gap: 14px; }
      .page-header { margin-bottom: 18px; align-items: center; gap: 10px; }
      .page-title { font-size: 1.1rem; }
      .btn-add { padding: 8px 12px; font-size: 0.8rem; gap: 5px; }
    }
  `],
})
export class AccommodationsTabComponent {
  readonly store = inject(AccommodationsStore);
  readonly destinationsStore = inject(DestinationsStore);

  readonly showModal = signal(false);

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

  onAccommodationSubmitted(event: { destinationId: string; payload: CreateAccommodationPayload }): void {
    this.store.createAccommodation(event.destinationId, event.payload, () => this.showModal.set(false));
  }
}
