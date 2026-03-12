import { SlicePipe, UpperCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { filter, switchMap, timer } from 'rxjs';
import { ActivityApiService, ActivityItem } from '@org/data-access-trips';

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444',
  '#06b6d4', '#f97316', '#ec4899', '#84cc16',
];

function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

@Component({
  selector: 'lib-activity-feed',
  standalone: true,
  imports: [RouterLink, SlicePipe, UpperCasePipe],
  template: `
    <div class="preview-card">
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

    .live-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
    }

    /* Skeleton */
    .skeleton-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: #f1f5f9; flex-shrink: 0;
      animation: shimmer 1.2s infinite linear;
    }
    .skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .skeleton-line {
      height: 10px; border-radius: 5px; background: #f1f5f9;
      animation: shimmer 1.2s infinite linear;
    }
    .skeleton-line--short { width: 45%; }
    @keyframes shimmer {
      0%   { background-color: #f1f5f9; }
      50%  { background-color: #e2e8f0; }
      100% { background-color: #f1f5f9; }
    }

    /* Empty */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 16px 0 8px; text-align: center;
    }
    .empty-text { margin: 0; font-size: 0.82rem; color: #94a3b8; max-width: 220px; line-height: 1.4; }

    .feed-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }

    .feed-item { display: flex; align-items: flex-start; gap: 10px; }

    .feed-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 0.75rem; font-weight: 700;
      flex-shrink: 0;
    }

    .feed-body { display: flex; flex-direction: column; gap: 2px; }
    .feed-text { margin: 0; font-size: 0.85rem; color: #334155; line-height: 1.4; }
    .feed-text strong { color: #0f172a; }
    .feed-time { font-size: 0.75rem; color: #94a3b8; }

    .btn-view-all {
      margin-top: 16px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #64748b;
      padding: 9px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 500;
      text-decoration: none;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      box-sizing: border-box;
    }
    .btn-view-all:hover { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
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
        console.log('[ActivityFeed] loading for tripId:', id);
        this.loading.set(true);
        return timer(0, 30_000).pipe(
          switchMap(() => this.api.getActivityByTrip(id)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => { console.log('[ActivityFeed] got items:', data.length); this._items.set(data); this.loading.set(false); },
      error: (err) => { console.error('[ActivityFeed] fetch failed:', err); this.loading.set(false); },
    });
  }
}
