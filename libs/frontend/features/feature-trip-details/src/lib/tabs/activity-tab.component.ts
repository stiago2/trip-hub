import { SlicePipe, UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { colorForUser, relativeTime } from '@org/data-access-trips';
import { ActivityStore } from '../store/activity.store';

const TYPE_COLORS: Record<string, string> = {
  destination_added: '#10b981',
  accommodation_added: '#3b82f6',
  transport_added: '#f59e0b',
  budget_updated: '#8b5cf6',
  trip_updated: '#64748b',
  member_added: '#ef4444',
};

@Component({
  selector: 'lib-activity-tab',
  standalone: true,
  imports: [SlicePipe, UpperCasePipe],
  template: `
    <div class="activity-page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Activity</h2>
          <p class="page-subtitle">Full history of changes to this trip.</p>
        </div>
        <button class="btn-refresh" (click)="store.load()" [disabled]="store.loading()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Refresh
        </button>
      </div>

      @if (store.loading()) {
        <div class="feed card">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="feed-item">
              <div class="skeleton-avatar shimmer"></div>
              <div class="skeleton-body">
                <div class="skeleton-line shimmer"></div>
                <div class="skeleton-line skeleton-line--short shimmer"></div>
              </div>
            </div>
          }
        </div>
      }

      @if (!store.loading() && store.items().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <p class="empty-text">No activity yet.</p>
          <p class="empty-hint">Actions like adding destinations, accommodations, and transport will show up here.</p>
        </div>
      }

      @if (!store.loading() && store.items().length > 0) {
        <div class="feed card">
          @for (item of store.items(); track item.id) {
            <div class="feed-item">
              <div class="feed-avatar" [style.background]="avatarColor(item.userId)">
                {{ item.userName | slice:0:1 | uppercase }}
              </div>
              <div class="feed-body">
                <p class="feed-text">
                  <strong>{{ item.userName }}</strong> {{ item.message }}
                </p>
                <span class="feed-time">{{ relativeTime(item.createdAt) }}</span>
              </div>
              <div class="feed-type-dot" [style.background]="typeColor(item.type)"></div>
            </div>
          }
        </div>

        @if (store.hasMore()) {
          <div class="load-more-row">
            <button class="btn-load-more" (click)="store.loadMore()" [disabled]="store.loading()">
              Load more
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .activity-page { padding: var(--space-2) 0; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
    .page-title { margin: 0 0 3px; font-size: var(--font-size-xl); font-weight: 800; color: var(--color-text); letter-spacing: -0.02em; }
    .page-subtitle { margin: 0; font-size: var(--font-size-base); color: var(--color-text-soft); }

    .btn-refresh {
      display: flex; align-items: center; gap: 6px;
      background: var(--color-surface-subtle); color: #475569; border: 1px solid var(--color-border);
      padding: 9px var(--space-4); border-radius: var(--radius-md); cursor: pointer;
      font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); white-space: nowrap;
      transition: background var(--transition-fast); outline: none;
    }
    .btn-refresh:hover:not(:disabled) { background: var(--color-surface-muted); }
    .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Empty state */
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: 64px 0; text-align: center; }
    .empty-icon { width: 64px; height: 64px; border-radius: 50%; background: var(--color-surface-muted); display: flex; align-items: center; justify-content: center; }
    .empty-text { margin: 0; font-size: 1rem; font-weight: 600; color: var(--color-text-subtle); }
    .empty-hint { margin: 0; font-size: var(--font-size-sm); color: var(--color-text-dim); max-width: 280px; line-height: var(--leading-relaxed); }

    /* Feed */
    .feed {
      padding: var(--space-2) 0;
    }

    .feed-item {
      display: flex; align-items: flex-start; gap: var(--space-3-5);
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--color-surface-subtle);
    }
    .feed-item:last-child { border-bottom: none; }

    .feed-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 0.85rem; font-weight: 700;
      flex-shrink: 0;
    }

    .feed-body { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .feed-text { margin: 0; font-size: 0.88rem; color: var(--color-text-body); line-height: 1.45; }
    .feed-text strong { color: var(--color-text); }
    .feed-time { font-size: 0.75rem; color: var(--color-text-subtle); }

    .feed-type-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }

    /* Skeleton */
    .skeleton-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--color-surface-muted); flex-shrink: 0; }
    .skeleton-body { flex: 1; display: flex; flex-direction: column; gap: var(--space-2); padding-top: 4px; }
    .skeleton-line { height: 12px; border-radius: 6px; background: var(--color-surface-muted); }
    .skeleton-line--short { width: 35%; }

    /* Load more */
    .load-more-row { display: flex; justify-content: center; margin-top: var(--space-5); }
    .btn-load-more {
      background: var(--color-surface-subtle); border: 1px solid var(--color-border); color: #475569;
      padding: 9px var(--space-6); border-radius: var(--radius-md); cursor: pointer;
      font-size: var(--font-size-base); font-weight: var(--font-weight-medium); transition: background var(--transition-fast);
    }
    .btn-load-more:hover:not(:disabled) { background: var(--color-surface-muted); }
    .btn-load-more:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class ActivityTabComponent {
  readonly store = inject(ActivityStore);

  readonly avatarColor = colorForUser;
  readonly relativeTime = relativeTime;

  typeColor(type: string): string {
    return TYPE_COLORS[type] ?? '#94a3b8';
  }
}
