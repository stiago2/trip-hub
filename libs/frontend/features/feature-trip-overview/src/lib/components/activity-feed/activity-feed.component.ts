import { SlicePipe, UpperCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { filter, switchMap, timer } from 'rxjs';
import { ActivityApiService, ActivityItem, colorForUser, relativeTime } from '@org/data-access-trips';

@Component({
  selector: 'lib-activity-feed',
  standalone: true,
  imports: [RouterLink, SlicePipe, UpperCasePipe],
  template: `
    <div class="preview-card card">
      <div class="card-header">
        <span class="card-title">Activity Feed</span>
        <span class="live-dot" title="Live"></span>
      </div>

      @if (loading()) {
        <ul class="feed-list">
          @for (i of [1,2,3]; track i) {
            <li class="feed-item">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-lines">
                <div class="skeleton-line"></div>
                <div class="skeleton-line skeleton-line--short"></div>
              </div>
            </li>
          }
        </ul>
      }

      @if (!loading() && items().length === 0) {
        <div class="empty-state">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <p class="empty-text">No activity yet. Start adding destinations, accommodations, or transport!</p>
        </div>
      }

      @if (!loading() && items().length > 0) {
        <ul class="feed-list">
          @for (item of items(); track item.id) {
            <li class="feed-item">
              <div class="feed-avatar" [style.background]="avatarColor(item.userId)">
                <span>{{ item.userName | slice:0:1 | uppercase }}</span>
              </div>
              <div class="feed-body">
                <p class="feed-text">
                  <strong>{{ item.userName }}</strong> {{ item.message }}
                </p>
                <span class="feed-time">{{ relativeTime(item.createdAt) }}</span>
              </div>
            </li>
          }
        </ul>
      }

      <a class="btn-view-all" [routerLink]="['/trips', tripId(), 'activity']">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        View full activity
      </a>
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

    .live-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
    }

    /* Skeleton */
    .skeleton-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--color-surface-muted); flex-shrink: 0;
      animation: shimmer 1.2s infinite linear;
    }
    .skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .skeleton-line {
      height: 10px; border-radius: 5px; background: var(--color-surface-muted);
      animation: shimmer 1.2s infinite linear;
    }
    .skeleton-line--short { width: 45%; }
    @keyframes shimmer {
      0%   { background-color: var(--color-surface-muted); }
      50%  { background-color: var(--color-border); }
      100% { background-color: var(--color-surface-muted); }
    }

    /* Empty */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
      padding: var(--space-4) 0 var(--space-2); text-align: center;
    }
    .empty-text { margin: 0; font-size: 0.82rem; color: var(--color-text-subtle); max-width: 220px; line-height: var(--leading-normal); }

    .feed-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }

    .feed-item { display: flex; align-items: flex-start; gap: 10px; }

    .feed-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 0.75rem; font-weight: var(--font-weight-bold);
      flex-shrink: 0;
    }

    .feed-body { display: flex; flex-direction: column; gap: 2px; }
    .feed-text { margin: 0; font-size: 0.85rem; color: var(--color-text-body); line-height: var(--leading-normal); }
    .feed-text strong { color: var(--color-text); }
    .feed-time { font-size: 0.75rem; color: var(--color-text-subtle); }

    .btn-view-all {
      margin-top: var(--space-4);
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      color: var(--color-text-soft);
      padding: 9px;
      border-radius: var(--radius-lg);
      font-size: 0.85rem;
      font-weight: var(--font-weight-medium);
      text-decoration: none;
      transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
      box-sizing: border-box;
    }
    .btn-view-all:hover { background: var(--color-action-light); border-color: #bfdbfe; color: var(--color-action-hover); }
  `],
})
export class ActivityFeedComponent {
  private readonly api = inject(ActivityApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tripId = input('');

  readonly loading = signal(false);
  private readonly _items = signal<ActivityItem[]>([]);
  readonly items = this._items.asReadonly();

  readonly relativeTime = relativeTime;
  readonly avatarColor = colorForUser;

  constructor() {
    toObservable(this.tripId).pipe(
      filter(id => !!id),
      switchMap(id => {
        this.loading.set(true);
        return timer(0, 30_000).pipe(
          switchMap(() => this.api.getActivityByTrip(id)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => { this._items.set(data.items); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }
}
