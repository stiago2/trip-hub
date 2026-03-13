import { DatePipe, SlicePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthStore } from '@org/feature-auth';
import { AuthService } from '@org/feature-auth';
import { TripStore } from '@org/data-access-trips';
import { TripTabsComponent } from '../components/trip-tabs.component';

const THUMB_GRADIENTS = [
  'linear-gradient(145deg, #667eea, #764ba2)',
  'linear-gradient(145deg, #4facfe, #00f2fe)',
  'linear-gradient(145deg, #43e97b, #38f9d7)',
  'linear-gradient(145deg, #f093fb, #f5576c)',
  'linear-gradient(145deg, #fda085, #f6d365)',
  'linear-gradient(145deg, #373b44, #4286f4)',
  'linear-gradient(145deg, #a18cd1, #fbc2eb)',
  'linear-gradient(145deg, #0f2027, #2c5364)',
];

@Component({
  selector: 'lib-trip-details-page',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TripTabsComponent, DatePipe, SlicePipe, TitleCasePipe, UpperCasePipe],
  template: `
    <div class="shell">

      <!-- Sidebar -->
      <aside class="sidebar">

        <!-- App logo / brand -->
        <div class="sidebar-brand">
          <div class="brand-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
          </div>
          <span class="brand-name">TripHub</span>
        </div>

        <!-- Nav tabs -->
        <lib-trip-tabs />

        <!-- Bottom -->
        <div class="sidebar-bottom">
          <a routerLink="/trips" class="back-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"/></svg>
            All Trips
          </a>

          @if (authStore.user()) {
            <div class="user-row">
              <div class="user-avatar">
                {{ (authStore.user()!.name || authStore.user()!.email) | slice:0:1 | uppercase }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ authStore.user()!.name || authStore.user()!.email }}</span>
                <button class="logout-btn" (click)="logout()">Sign out</button>
              </div>
            </div>
          }
        </div>
      </aside>

      <!-- Main -->
      <div class="main">

        <!-- Trip header -->
        <header class="trip-header" [style.--accent]="store.trip() ? thumbGradient(store.trip()!.id) : 'linear-gradient(135deg,#94a3b8,#cbd5e1)'">
          <div class="header-banner"></div>
          <div class="header-body">
            <div class="header-left">
              @if (store.loading()) {
                <div class="header-thumb header-thumb--skeleton"></div>
                <div class="header-skeleton">
                  <span class="skeleton-title"></span>
                  <span class="skeleton-dates"></span>
                </div>
              } @else if (store.trip()) {
                <div class="header-thumb" [style.background]="thumbGradient(store.trip()!.id)">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="2">
                    <circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                </div>
                <div class="header-text">
                  <h1 class="header-title">{{ store.trip()!.title | titlecase }}</h1>
                  <div class="header-meta">
                    <span class="header-dates">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {{ store.trip()!.startDate | date:'MMM d' }} – {{ store.trip()!.endDate | date:'MMM d, yyyy' }}
                    </span>
                    <span class="header-duration">{{ tripDays(store.trip()!.startDate, store.trip()!.endDate) }} days</span>
                  </div>
                </div>
              }
            </div>
            <div class="header-right">
              <button class="btn-share">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                <span class="btn-share-label">Share</span>
              </button>
              <button class="btn-bell" title="Notifications">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </button>
            </div>
          </div>
        </header>

        <!-- Tab content -->
        <div class="content">
          <router-outlet />
        </div>

        <!-- Mobile bottom nav (hidden on desktop) -->
        <lib-trip-tabs class="mobile-nav-bar" />
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex; height: 100vh; overflow: hidden; background: #f1f5f9;
    }

    /* Sidebar */
    .sidebar {
      width: 230px; flex-shrink: 0;
      background: #0f172a; border-right: none;
      display: flex; flex-direction: column;
      padding: 16px 12px; overflow-y: auto; scrollbar-width: none;
    }
    .sidebar::-webkit-scrollbar { display: none; }

    /* Brand */
    .sidebar-brand {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 14px;
    }
    .brand-logo {
      width: 34px; height: 34px; border-radius: 10px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      display: flex; align-items: center; justify-content: center;
      color: white; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(99,102,241,0.4);
    }
    .brand-name {
      font-size: 1rem; font-weight: 700; color: #f8fafc; letter-spacing: -0.01em;
    }

    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

    /* Bottom */
    .sidebar-bottom {
      margin-top: auto; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08);
    }

    .back-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 12px; border-radius: 8px; margin-bottom: 10px;
      text-decoration: none;
      background: rgba(59,130,246,0.15); color: #93c5fd;
      font-size: 0.825rem; font-weight: 600;
      border: 1px solid rgba(59,130,246,0.25);
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .back-btn:hover {
      background: rgba(59,130,246,0.28); color: #bfdbfe;
      border-color: rgba(59,130,246,0.4);
    }

    .user-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 10px; border-radius: 10px;
      background: rgba(255,255,255,0.06);
    }
    .user-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
    }
    .user-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .user-name {
      font-size: 0.8rem; font-weight: 600; color: #f1f5f9;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .logout-btn {
      background: none; border: none; padding: 0;
      font-size: 0.72rem; color: #64748b; cursor: pointer; text-align: left;
      transition: color 0.15s; font-weight: 500;
    }
    .logout-btn:hover { color: #f87171; }

    /* Main */
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .trip-header {
      position: relative; flex-shrink: 0;
      background: white; border-bottom: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .header-banner {
      height: 6px; background: var(--accent); opacity: 0.9;
    }
    .header-body {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 28px;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-thumb {
      width: 54px; height: 54px; border-radius: 14px; flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
      display: flex; align-items: center; justify-content: center;
    }
    .header-thumb--skeleton {
      background: #e2e8f0; animation: pulse 1.5s ease infinite;
    }
    .header-text { display: flex; flex-direction: column; gap: 6px; }
    .header-skeleton { display: flex; flex-direction: column; gap: 6px; }
    .skeleton-title {
      display: block; width: 180px; height: 22px;
      background: #e2e8f0; border-radius: 6px;
      animation: pulse 1.5s ease infinite;
    }
    .skeleton-dates {
      display: block; width: 120px; height: 14px;
      background: #e2e8f0; border-radius: 4px;
      animation: pulse 1.5s ease infinite;
    }
    .header-title {
      margin: 0; font-size: 1.35rem; font-weight: 800;
      color: #0f172a; letter-spacing: -0.025em; line-height: 1.2;
    }
    .header-meta { display: flex; align-items: center; gap: 10px; }
    .header-dates {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.8rem; color: #64748b;
    }
    .header-duration {
      font-size: 0.72rem; font-weight: 600; color: #6366f1;
      background: #eef2ff; padding: 2px 8px; border-radius: 20px;
      border: 1px solid #e0e7ff;
    }
    .header-right { display: flex; align-items: center; gap: 10px; }

    .btn-share {
      display: flex; align-items: center; gap: 6px;
      background: white; border: 1px solid #e2e8f0;
      padding: 8px 16px; border-radius: 8px;
      font-size: 0.85rem; font-weight: 500; color: #374151;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-share:hover { background: #f8fafc; }

    .btn-bell {
      background: white; border: 1px solid #e2e8f0;
      width: 38px; height: 38px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: #64748b; cursor: pointer; transition: background 0.15s;
    }
    .btn-bell:hover { background: #f8fafc; }

    .content { flex: 1; overflow-y: auto; padding: 28px; }

    /* Mobile bottom nav — hidden on desktop */
    .mobile-nav-bar { display: none; }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .sidebar { width: 200px; }
    }
    @media (max-width: 700px) {
      .sidebar { display: none; }
      .content { padding: 16px; padding-bottom: 80px; }

      /* Header: make thumb smaller, hide Share label */
      .header-body { padding: 10px 14px; gap: 8px; }
      .header-thumb { width: 38px; height: 38px; border-radius: 10px; }
      .header-thumb svg { width: 16px; height: 16px; }
      .header-title { font-size: 1rem; }
      .header-dates { font-size: 0.72rem; }
      .header-duration { display: none; }
      .btn-share-label { display: none; }
      .btn-share { padding: 7px 10px; }

      /* Mobile bottom bar + drawer trigger */
      .mobile-nav-bar {
        display: block;
        position: fixed; bottom: 0; left: 0; right: 0;
        background: #0f172a;
        border-top: 1px solid rgba(255,255,255,0.08);
        padding: 6px 8px env(safe-area-inset-bottom, 8px);
        z-index: 100;
      }
    }
  `],
})
export class TripDetailsPage implements OnInit {
  readonly store = inject(TripStore);
  readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const tripId = this.route.snapshot.paramMap.get('tripId') ?? '';
    this.store.setActiveTrip(tripId);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  thumbGradient(id: string): string {
    return THUMB_GRADIENTS[id.charCodeAt(0) % THUMB_GRADIENTS.length];
  }

  tripDays(start: string, end: string): number {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(ms / 86_400_000));
  }
}
