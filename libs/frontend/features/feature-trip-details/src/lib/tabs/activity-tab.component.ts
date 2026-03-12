import { SlicePipe, UpperCasePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TYPE_ICONS: Record<string, string> = {
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
        <button class="btn-refresh" (click)="loadMore()" [disabled]="loading()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Refresh
        </button>
      </div>

      @if (loading()) {
        <div class="feed">
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

      @if (!loading() && items().length === 0) {
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

      @if (!loading() && items().length > 0) {
        <div class="feed">
          @for (item of items(); track item.id) {
            <div class="feed-item">
              <div class="feed-avatar" [style.background]="avatarColor(item.userId)">
                {{ item.userName | slice:0:1 | uppercase }}
              </div>
              <div class="feed-body">
                <p class="feed-text">
                  <strong>{{ item.userName }}</strong> {{ item.message }}
                </p>
                <span class="feed-time">{{ formatTime(item.createdAt) }}</span>
              </div>
              <div class="feed-type-dot" [style.background]="typeColor(item.type)"></div>
            </div>
          }
        </div>

        @if (hasMore()) {
          <div class="load-more-row">
            <button class="btn-load-more" (click)="loadMore()" [disabled]="loading()">
              Load more
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .activity-page { padding: 8px 0; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { margin: 0 0 3px; font-size: 1.35rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .page-subtitle { margin: 0; font-size: 0.875rem; color: #64748b; }

    .btn-refresh {
      display: flex; align-items: center; gap: 6px;
      background: #f8fafc; color: #475569; border: 1px solid #e2e8f0;
      padding: 9px 16px; border-radius: 8px; cursor: pointer;
      font-size: 0.875rem; font-weight: 600; white-space: nowrap;
      transition: background 0.15s; outline: none;
    }
    .btn-refresh:hover:not(:disabled) { background: #f1f5f9; }
    .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Empty state */
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 64px 0; text-align: center; }
    .empty-icon { width: 64px; height: 64px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
    .empty-text { margin: 0; font-size: 1rem; font-weight: 600; color: #94a3b8; }
    .empty-hint { margin: 0; font-size: 0.82rem; color: #cbd5e1; max-width: 280px; line-height: 1.5; }

    /* Feed */
    .feed {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 8px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .feed-item {
      display: flex; align-items: flex-start; gap: 14px;
      padding: 16px 20px;
      border-bottom: 1px solid #f8fafc;
    }
    .feed-item:last-child { border-bottom: none; }

    .feed-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 0.85rem; font-weight: 700;
      flex-shrink: 0;
    }

    .feed-body { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .feed-text { margin: 0; font-size: 0.88rem; color: #334155; line-height: 1.45; }
    .feed-text strong { color: #0f172a; }
    .feed-time { font-size: 0.75rem; color: #94a3b8; }

    .feed-type-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }

    /* Skeleton */
    @keyframes shimmer {
      0%   { background-color: #f1f5f9; }
      50%  { background-color: #e2e8f0; }
      100% { background-color: #f1f5f9; }
    }
    .shimmer { animation: shimmer 1.2s infinite linear; }
    .skeleton-avatar { width: 38px; height: 38px; border-radius: 50%; background: #f1f5f9; flex-shrink: 0; }
    .skeleton-body { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
    .skeleton-line { height: 12px; border-radius: 6px; background: #f1f5f9; }
    .skeleton-line--short { width: 35%; }

    /* Load more */
    .load-more-row { display: flex; justify-content: center; margin-top: 20px; }
    .btn-load-more {
      background: #f8fafc; border: 1px solid #e2e8f0; color: #475569;
      padding: 9px 24px; border-radius: 8px; cursor: pointer;
      font-size: 0.875rem; font-weight: 500; transition: background 0.15s;
    }
    .btn-load-more:hover:not(:disabled) { background: #f1f5f9; }
    .btn-load-more:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class ActivityTabComponent implements OnInit {
  private readonly api = inject(ActivityApiService);
  private readonly route = inject(ActivatedRoute);

  private tripId = '';
  private limit = 20;

  readonly loading = signal(false);
  private readonly _items = signal<ActivityItem[]>([]);
  readonly items = this._items.asReadonly();
  readonly hasMore = signal(false);

  readonly avatarColor = colorForUser;

  ngOnInit(): void {
    this.tripId = this.resolveTripId();
    this.fetch();
  }

  loadMore(): void {
    this.limit += 20;
    this.fetch();
  }

  formatTime(dateStr: string): string {
    return relativeTime(dateStr);
  }

  typeColor(type: string): string {
    return TYPE_ICONS[type] ?? '#94a3b8';
  }

  private fetch(): void {
    this.loading.set(true);
    this.api.getActivityByTrip(this.tripId, this.limit).subscribe({
      next: (data) => {
        this._items.set(data);
        this.hasMore.set(data.length === this.limit);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private resolveTripId(): string {
    let snapshot: ActivatedRouteSnapshot | null = this.route.snapshot;
    while (snapshot) {
      const id = snapshot.paramMap.get('tripId');
      if (id) return id;
      snapshot = snapshot.parent;
    }
    return '';
  }
}
