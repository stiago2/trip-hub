import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Transport, TransportApiService } from '@org/data-access-trips';

const TYPE_ICON: Record<string, string> = {
  FLIGHT: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 16v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><path d="M12 12V3"/><path d="M7 8l5-5 5 5"/><line x1="3" y1="16" x2="21" y2="16"/></svg>`,
  TRAIN: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16"/><path d="M8 3v8"/><path d="M16 3v8"/><circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/><path d="M8 17l-2 2"/><path d="M16 17l2 2"/></svg>`,
  BUS:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M7 15h0"/><path d="M17 15h0"/><path d="M7 19v2"/><path d="M17 19v2"/></svg>`,
  CAR:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h13l4 4v6a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
};

@Component({
  selector: 'lib-upcoming-transport-preview',
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe],
  template: `
    <div class="preview-card card">
      <div class="card-header">
        <span class="card-title">Upcoming Transport</span>
        <a class="card-link" [routerLink]="['/trips', tripId(), 'transport']">See all</a>
      </div>

      @if (loading()) {
        <div class="skeleton-list">
          <div class="skeleton-item shimmer"></div>
          <div class="skeleton-item shimmer"></div>
        </div>
      } @else if (upcoming().length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5"/>
              <circle cx="16" cy="19" r="2"/><circle cx="8" cy="19" r="2"/>
              <polyline points="16 17 10 17 8 17"/>
              <line x1="12" y1="5" x2="12" y2="10"/><line x1="9" y1="10" x2="17" y2="10"/>
            </svg>
          </div>
          <p class="empty-title">No transport planned</p>
          <a class="btn-add" [routerLink]="['/trips', tripId(), 'transport']">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add transport
          </a>
        </div>
      } @else {
        <div class="transport-list">
          @for (t of upcoming(); track t.id) {
            <div class="transport-item">
              <div class="type-badge" [innerHTML]="icon(t.type)"></div>
              <div class="transport-info">
                <div class="route">
                  <span class="location">{{ t.fromLocation }}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>
                  <span class="location">{{ t.toLocation }}</span>
                </div>
                <div class="transport-time">
                  {{ t.departureTime | date:'MMM d · HH:mm' }}
                </div>
              </div>
              <span class="type-label">{{ t.type | titlecase }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .preview-card {
      padding: var(--space-5);
    }

    .card-header {
      display: flex; justify-content: space-between; align-items: center;
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

    /* Transport list */
    .transport-list { display: flex; flex-direction: column; gap: 10px; }

    .transport-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px var(--space-3); border-radius: var(--radius-lg);
      background: var(--color-surface-subtle); border: 1px solid var(--color-surface-muted);
    }

    .type-badge {
      width: 32px; height: 32px; border-radius: var(--radius-md);
      background: var(--color-action-light); color: var(--color-action);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .transport-info { flex: 1; min-width: 0; }

    .route {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.82rem; font-weight: var(--font-weight-semibold); color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .location { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70px; }

    .transport-time {
      font-size: 0.75rem; color: var(--color-text-subtle); margin-top: 2px;
    }

    .type-label {
      font-size: var(--font-size-2xs); font-weight: var(--font-weight-bold); color: var(--color-action);
      background: var(--color-action-light); padding: 2px 7px; border-radius: var(--radius-3xl);
      flex-shrink: 0; text-transform: capitalize;
    }

    /* Empty state */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--space-2); padding: var(--space-4) 0 var(--space-2);
    }
    .empty-icon-wrap {
      width: 52px; height: 52px; border-radius: 14px;

      background: var(--color-surface-subtle);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
    }
    .empty-title { margin: 0; font-size: var(--font-size-body); color: var(--color-text-soft); font-weight: var(--font-weight-semibold); }
    .btn-add {
      display: flex; align-items: center; gap: 5px; margin-top: 4px;
      background: var(--color-surface-subtle); color: #475569; text-decoration: none;
      font-size: 0.8rem; font-weight: var(--font-weight-semibold); padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md); border: 1px solid var(--color-border);
      transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
    }
    .btn-add:hover { background: var(--color-action-light); border-color: #bfdbfe; color: var(--color-action-hover); }

    /* Skeleton */
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .shimmer {
      background: linear-gradient(90deg, var(--color-surface-muted) 25%, var(--color-border) 50%, var(--color-surface-muted) 75%);
      background-size: 200% 100%; animation: shimmer 1.4s ease infinite;
    }
    .skeleton-list { display: flex; flex-direction: column; gap: 10px; }
    .skeleton-item { height: 54px; border-radius: var(--radius-lg); }
  `],
})
export class UpcomingTransportPreviewComponent {
  private readonly api = inject(TransportApiService);

  readonly tripId = input('');

  private readonly _transports = signal<Transport[]>([]);
  readonly loading = signal(false);

  readonly upcoming = computed(() =>
    [...this._transports()]
      .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
      .slice(0, 3)
  );

  constructor() {
    effect(() => {
      const id = this.tripId();
      if (!id) return;
      this.loading.set(true);
      this.api.getTransports(id).subscribe({
        next: (data) => { this._transports.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    });
  }

  icon(type: string): string {
    return TYPE_ICON[type] ?? TYPE_ICON['CAR'];
  }
}
