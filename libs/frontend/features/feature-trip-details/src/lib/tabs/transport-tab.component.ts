import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TransportType } from '@org/data-access-trips';
import { AddTransportModalComponent } from '../components/add-transport-modal/add-transport-modal.component';
import { TransportStore } from '../store/transport.store';

const TYPE_ICON_BG: Record<TransportType, string> = {
  FLIGHT: '#dbeafe',
  TRAIN:  '#d1fae5',
  BUS:    '#ede9fe',
  CAR:    '#fef3c7',
};

@Component({
  selector: 'lib-transport-tab',
  standalone: true,
  imports: [DecimalPipe, DatePipe, TitleCasePipe, AddTransportModalComponent],
  template: `
    <div class="transport-page">

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Transport</h1>
          @if (store.transports().length > 0) {
            <div class="trip-stats">
              <span class="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
                {{ store.transports().length }} booking{{ store.transports().length !== 1 ? 's' : '' }}
              </span>
              @if (totalCost() > 0) {
                <span class="stat-pill stat-pill--green">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  \${{ totalCost() | number:'1.0-0' }} total
                </span>
              }
            </div>
          }
        </div>
        <button class="btn-add" (click)="showModal.set(true)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Transport
        </button>
      </div>

      <!-- Loading skeleton -->
      @if (store.loading()) {
        <div class="cards-list">
          @for (s of skeletons; track s) {
            <div class="skeleton-card shimmer"></div>
          }
        </div>

      <!-- Empty state -->
      } @else if (store.transports().length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.3" stroke-linecap="round">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>
          <p class="empty-title">No transport planned yet</p>
          <p class="empty-desc">Add flights, trains, buses or car rides to your itinerary.</p>
          <button class="btn-add btn-add--lg" (click)="showModal.set(true)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add First Transport
          </button>
        </div>

      <!-- Timeline list -->
      } @else {
        <div class="timeline">
          @for (item of sorted(); track item.id) {

            <div class="timeline-entry">
              <!-- Card (boarding-pass style) -->
              <div class="transport-card card">
                <!-- Left icon panel -->
                <div class="card-panel" [style.background]="typeIconBg(item.type)">
                  @switch (item.type) {
                    @case ('FLIGHT') {
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="1.8" stroke-linecap="round">
                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                      </svg>
                    }
                    @case ('TRAIN') {
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#065f46" stroke-width="1.8" stroke-linecap="round">
                        <rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16"/><path d="M8 3v8"/><path d="M16 3v8"/>
                        <circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/><path d="M8 17l-2 2"/><path d="M16 17l2 2"/>
                      </svg>
                    }
                    @case ('BUS') {
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5b21b6" stroke-width="1.8" stroke-linecap="round">
                        <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
                        <circle cx="7" cy="19" r="1"/><circle cx="17" cy="19" r="1"/><path d="M7 5v5"/><path d="M17 5v5"/>
                      </svg>
                    }
                    @default {
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="1.8" stroke-linecap="round">
                        <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h13l4 4v6a2 2 0 0 1-2 2h-2"/>
                        <circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
                      </svg>
                    }
                  }
                </div>

                <!-- Card body -->
                <div class="card-body">
                  <div class="card-top-row">
                    <span class="type-badge" [class]="'type-badge--' + item.type.toLowerCase()">
                      {{ item.type | titlecase }}
                    </span>
                    @if (item.price != null && item.price > 0) {
                      <span class="price-badge">\${{ item.price | number:'1.0-2' }}</span>
                    }
                  </div>

                  <div class="route-row">
                    <span class="location">{{ item.fromLocation }}</span>
                    <span class="route-arrow">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>
                      </svg>
                    </span>
                    <span class="location">{{ item.toLocation }}</span>
                  </div>

                  <div class="time-row">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ item.departureTime | date:'MMM d · HH:mm' }}
                    @if (item.arrivalTime) {
                      <span class="time-sep">→</span>{{ item.arrivalTime | date:'HH:mm' }}
                    }
                  </div>
                </div>

                <!-- Delete -->
                <button class="btn-delete" (click)="store.deleteTransport(item.id)" title="Remove">
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>
          <div class="summary-main">
            <span class="summary-eyebrow">TRANSPORT SUMMARY</span>
            <span class="summary-count">{{ store.transports().length }} booking{{ store.transports().length !== 1 ? 's' : '' }}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-stats">
            @for (entry of typeCounts(); track entry.type) {
              <div class="summary-stat">
                <span class="summary-stat-label">{{ entry.type }}</span>
                <span class="summary-stat-value">{{ entry.count }}</span>
              </div>
            }
            @if (totalCost() > 0) {
              <div class="summary-stat">
                <span class="summary-stat-label">TOTAL COST</span>
                <span class="summary-stat-value summary-stat-value--blue">\${{ totalCost() | number:'1.0-2' }}</span>
              </div>
            }
          </div>
        </div>
      }

    </div>

    @if (showModal()) {
      <lib-add-transport-modal
        (closed)="showModal.set(false)"
      />
    }
  `,
  styles: [`
    .transport-page { padding: var(--space-2) 0; }

    /* ── Header ── */
    .header-left { display: flex; flex-direction: column; gap: 10px; }

    .trip-stats { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .stat-pill--green { color: #059669; background: #ecfdf5; }

    /* ── Timeline ── */
    .cards-list { display: flex; flex-direction: column; gap: 0; }
    .timeline { display: flex; flex-direction: column; }

    .timeline-entry { display: flex; align-items: stretch; }

    /* ── Transport card ── */
    .transport-card {
      flex: 1;
      display: flex; flex-direction: row; overflow: hidden;
      margin-bottom: var(--space-3); position: relative;
      transition: transform var(--transition-normal), box-shadow var(--transition-normal);
    }
    .transport-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(0,0,0,0.10);
    }

    /* Left icon panel */
    .card-panel {
      width: 82px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: 15px 0 0 15px; overflow: hidden;
      border-right: 1px solid rgba(0,0,0,0.06);
    }

    /* Card body */
    .card-body {
      flex: 1; padding: 18px 52px 18px 18px;
      display: flex; flex-direction: column;
      justify-content: center; gap: 7px;
    }

    .card-top-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: var(--space-2);
    }

    .type-badge {
      display: inline-flex; align-items: center;
      font-size: 0.68rem; font-weight: var(--font-weight-bold); letter-spacing: var(--tracking-wide);
      padding: 3px 9px; border-radius: var(--radius-3xl);
    }
    .type-badge--flight { color: #1d4ed8; background: #dbeafe; }
    .type-badge--train  { color: #065f46; background: #d1fae5; }
    .type-badge--bus    { color: #5b21b6; background: #ede9fe; }
    .type-badge--car    { color: #92400e; background: #fef3c7; }

    .price-badge {
      font-size: var(--font-size-sm); font-weight: 800; color: var(--color-text);
      background: var(--color-surface-subtle); border: 1px solid var(--color-border);
      padding: 3px 10px; border-radius: var(--radius-3xl);
    }

    .route-row {
      display: flex; align-items: center; gap: var(--space-2);
    }
    .location {
      font-size: var(--font-size-card); font-weight: var(--font-weight-extrabold); color: var(--color-text);
      letter-spacing: var(--tracking-tight);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 160px;
    }
    .route-arrow { display: flex; align-items: center; flex-shrink: 0; }

    .time-row {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.8rem; color: var(--color-text-soft);
    }
    .time-row svg { color: var(--color-text-subtle); flex-shrink: 0; }
    .time-sep { color: var(--color-text-dim); margin: 0 2px; }

    /* Delete button */
    .btn-delete {
      position: absolute; top: 12px; right: 12px;
      width: 28px; height: 28px; border-radius: var(--radius-xs);
      background: var(--color-surface-muted); border: none;
      display: flex; align-items: center; justify-content: center;
      color: var(--color-text-dim); cursor: pointer;
      opacity: 0; transition: opacity var(--transition-fast), background var(--transition-fast), color var(--transition-fast);
    }
    .transport-card:hover .btn-delete { opacity: 1; }
    .btn-delete:hover { background: var(--color-danger-light); color: var(--color-danger); }

    /* ── Skeleton ── */
    .skeleton-card { height: 90px; border-radius: var(--radius-2xl); margin-bottom: var(--space-3); }

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
    .summary-count { font-size: 1rem; font-weight: var(--font-weight-bold); color: white; }
    .summary-divider { width: 1px; background: var(--color-dark-surface); align-self: stretch; flex-shrink: 0; }
    .summary-stats { display: flex; gap: 32px; margin-left: 4px; flex-wrap: wrap; }
    .summary-stat { display: flex; flex-direction: column; gap: 3px; }
    .summary-stat-label { font-size: 0.65rem; font-weight: var(--font-weight-semibold); letter-spacing: var(--tracking-widest); color: var(--color-text-soft); text-transform: uppercase; }
    .summary-stat-value { font-size: 1.1rem; font-weight: var(--font-weight-bold); color: white; }
    .summary-stat-value--blue { color: var(--color-action); }

    @media (max-width: 600px) {
      .card-panel { width: 60px; }

      /* Allow route row to wrap so full city names are visible */
      .route-row { flex-wrap: wrap; row-gap: 2px; }
      .location { max-width: none; flex: 1 1 auto; min-width: 0; }
      .route-arrow { flex-shrink: 0; }

      /* Summary bar: icon+title inline, stats grid below */
      .summary-bar {
        flex-direction: column; gap: var(--space-3); padding: var(--space-4);
      }
      .summary-divider { display: none; }
      .summary-icon-wrap { width: 36px; height: 36px; }
      .summary-main { flex-direction: row; align-items: center; gap: 10px; width: 100%; }
      .summary-eyebrow { display: none; }
      .summary-count { font-size: 0.95rem; }
      .summary-stats {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 10px; margin: 0; width: 100%;
        border-top: 1px solid var(--color-dark-surface); padding-top: var(--space-3);
      }
      .summary-stat-value { font-size: 1rem; }

      .page-header { margin-bottom: 18px; align-items: center; gap: 10px; }
      .page-title { font-size: 1.1rem; }
      .btn-add { padding: var(--space-2) var(--space-3); font-size: 0.8rem; gap: 5px; }
    }
  `],
})
export class TransportTabComponent {
  readonly store = inject(TransportStore);

  readonly showModal = signal(false);
  readonly skeletons = [1, 2, 3];

  readonly sorted = computed(() =>
    [...this.store.transports()].sort(
      (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
    ),
  );

  readonly totalCost = computed(() =>
    this.store.transports().reduce((sum, t) => sum + (t.price != null ? Number(t.price) : 0), 0),
  );

  readonly typeCounts = computed(() => {
    const counts: Record<string, number> = {};
    for (const t of this.store.transports()) {
      counts[t.type] = (counts[t.type] ?? 0) + 1;
    }
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  });

  typeIconBg(type: TransportType): string {
    return TYPE_ICON_BG[type] ?? TYPE_ICON_BG['CAR'];
  }

}
