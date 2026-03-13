import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { CreateTransportPayload, TransportType } from '@org/data-access-trips';
import { AddTransportModalComponent } from '../components/add-transport-modal/add-transport-modal.component';
import { TransportStore } from '../store/transport.store';

const TYPE_GRADIENT: Record<TransportType, string> = {
  FLIGHT: 'linear-gradient(145deg, #1e3a5f 0%, #2563eb 100%)',
  TRAIN:  'linear-gradient(145deg, #064e3b 0%, #059669 100%)',
  BUS:    'linear-gradient(145deg, #3b0764 0%, #7c3aed 100%)',
  CAR:    'linear-gradient(145deg, #451a03 0%, #d97706 100%)',
};

const TYPE_SVG: Record<TransportType, string> = {
  FLIGHT: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8" stroke-linecap="round"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
  TRAIN:  `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16"/><path d="M8 3v8"/><path d="M16 3v8"/><circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/><path d="M8 17l-2 2"/><path d="M16 17l2 2"/></svg>`,
  BUS:    `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="7" cy="19" r="1"/><circle cx="17" cy="19" r="1"/><path d="M7 5v5"/><path d="M17 5v5"/></svg>`,
  CAR:    `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8" stroke-linecap="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h13l4 4v6a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
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
          @for (item of sorted(); track item.id; let last = $last) {

            <div class="timeline-entry">
              <!-- Vertical track -->
              <div class="track-col">
                <div class="track-dot" [class]="'track-dot--' + item.type.toLowerCase()"></div>
                @if (!last) { <div class="track-line"></div> }
              </div>

              <!-- Card (boarding-pass style) -->
              <div class="transport-card">
                <!-- Left gradient panel -->
                <div class="card-panel" [style.background]="typeGradient(item.type)" [innerHTML]="typeIcon(item.type)"></div>

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
        (submitted)="onTransportSubmitted($event)"
      />
    }
  `,
  styles: [`
    .transport-page { padding: 8px 0; }

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
    .stat-pill--green { color: #059669; background: #ecfdf5; }

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

    /* ── Timeline ── */
    .cards-list { display: flex; flex-direction: column; gap: 0; }
    .timeline { display: flex; flex-direction: column; }

    .timeline-entry { display: flex; gap: 14px; align-items: stretch; }

    /* Track (dot + line) */
    .track-col {
      display: flex; flex-direction: column; align-items: center;
      flex-shrink: 0; padding-top: 22px;
    }
    .track-dot {
      width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
      border: 2px solid white;
      box-shadow: 0 0 0 2px currentColor;
    }
    .track-dot--flight { color: #2563eb; background: #2563eb; }
    .track-dot--train  { color: #059669; background: #059669; }
    .track-dot--bus    { color: #7c3aed; background: #7c3aed; }
    .track-dot--car    { color: #d97706; background: #d97706; }

    .track-line {
      flex: 1; width: 2px; background: #e2e8f0;
      margin: 6px 0 0; min-height: 16px;
    }

    /* ── Transport card ── */
    .transport-card {
      flex: 1; background: white;
      border: 1px solid #e8edf3; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
      display: flex; flex-direction: row; overflow: hidden;
      margin-bottom: 12px; position: relative;
      transition: transform 0.18s, box-shadow 0.18s;
    }
    .transport-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(0,0,0,0.10);
    }

    /* Left gradient panel */
    .card-panel {
      width: 82px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: 15px 0 0 15px; overflow: hidden;
    }

    /* Card body */
    .card-body {
      flex: 1; padding: 18px 52px 18px 18px;
      display: flex; flex-direction: column;
      justify-content: center; gap: 7px;
    }

    .card-top-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px;
    }

    .type-badge {
      display: inline-flex; align-items: center;
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.07em;
      padding: 3px 9px; border-radius: 20px;
    }
    .type-badge--flight { color: #1d4ed8; background: #dbeafe; }
    .type-badge--train  { color: #065f46; background: #d1fae5; }
    .type-badge--bus    { color: #5b21b6; background: #ede9fe; }
    .type-badge--car    { color: #92400e; background: #fef3c7; }

    .price-badge {
      font-size: 0.82rem; font-weight: 800; color: #0f172a;
      background: #f8fafc; border: 1px solid #e2e8f0;
      padding: 3px 10px; border-radius: 20px;
    }

    .route-row {
      display: flex; align-items: center; gap: 8px;
    }
    .location {
      font-size: 1.05rem; font-weight: 800; color: #0f172a;
      letter-spacing: -0.02em;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 160px;
    }
    .route-arrow { display: flex; align-items: center; flex-shrink: 0; }

    .time-row {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.8rem; color: #64748b;
    }
    .time-row svg { color: #94a3b8; flex-shrink: 0; }
    .time-sep { color: #cbd5e1; margin: 0 2px; }

    /* Delete button */
    .btn-delete {
      position: absolute; top: 12px; right: 12px;
      width: 28px; height: 28px; border-radius: 7px;
      background: #f1f5f9; border: none;
      display: flex; align-items: center; justify-content: center;
      color: #cbd5e1; cursor: pointer;
      opacity: 0; transition: opacity 0.15s, background 0.15s, color 0.15s;
    }
    .transport-card:hover .btn-delete { opacity: 1; }
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
    .skeleton-card { height: 90px; border-radius: 16px; margin-bottom: 12px; }

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
    .summary-count { font-size: 1rem; font-weight: 700; color: white; }
    .summary-divider { width: 1px; background: #1e293b; align-self: stretch; flex-shrink: 0; }
    .summary-stats { display: flex; gap: 32px; margin-left: 4px; flex-wrap: wrap; }
    .summary-stat { display: flex; flex-direction: column; gap: 3px; }
    .summary-stat-label { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; color: #64748b; text-transform: uppercase; }
    .summary-stat-value { font-size: 1.1rem; font-weight: 700; color: white; }
    .summary-stat-value--blue { color: #3b82f6; }

    @media (max-width: 600px) {
      .card-panel { width: 60px; }
      .location { max-width: 100px; }
      .summary-bar { flex-wrap: wrap; gap: 14px; }
      .page-header { margin-bottom: 18px; align-items: center; gap: 10px; }
      .page-title { font-size: 1.1rem; }
      .btn-add { padding: 8px 12px; font-size: 0.8rem; gap: 5px; }
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

  onTransportSubmitted(payload: CreateTransportPayload): void {
    this.store.createTransport(payload, () => this.showModal.set(false));
  }

  typeGradient(type: TransportType): string {
    return TYPE_GRADIENT[type] ?? TYPE_GRADIENT['CAR'];
  }

  typeIcon(type: TransportType): string {
    return TYPE_SVG[type] ?? TYPE_SVG['CAR'];
  }
}
