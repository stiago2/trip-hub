import { Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';

export type TripTab = 'overview' | 'inventory' | 'destinations' | 'transport' | 'accommodations' | 'budget' | 'members';

const TABS: { id: TripTab; label: string; icon: string }[] = [
  {
    id: 'overview',
    label: 'Dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  },
  {
    id: 'destinations',
    label: 'Destinations',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  },
  {
    id: 'transport',
    label: 'Transport',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5"/><circle cx="16" cy="19" r="2"/><circle cx="8" cy="19" r="2"/><polyline points="16 17 10 17 8 17"/><line x1="12" y1="5" x2="12" y2="10"/><line x1="9" y1="10" x2="17" y2="10"/></svg>`,
  },
  {
    id: 'accommodations',
    label: 'Accommodations',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  {
    id: 'inventory',
    label: 'Packing List',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  },
  {
    id: 'budget',
    label: 'Budget',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  },
  {
    id: 'members',
    label: 'Members',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
];

@Component({
  selector: 'lib-trip-tabs',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <!-- Sidebar nav (desktop) -->
    <nav class="trip-nav">
      @for (tab of tabs; track tab.id) {
        <a class="nav-item" [routerLink]="['/trips', tripId, tab.id]" routerLinkActive="active">
          <span class="nav-icon" [innerHTML]="tab.icon"></span>
          <span class="nav-label">{{ tab.label }}</span>
        </a>
      }
    </nav>

    <!-- Mobile: hamburger button only -->
    <button class="mobile-hamburger" (click)="drawerOpen.set(true)" aria-label="Open navigation">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    <!-- Mobile: slide-up drawer -->
    @if (drawerOpen()) {
      <div class="drawer-overlay" (click)="drawerOpen.set(false)">
        <div class="drawer" (click)="$event.stopPropagation()">
          <div class="drawer-handle"></div>
          <div class="drawer-header">
            <span class="drawer-title">Navigation</span>
            <button class="drawer-close" (click)="drawerOpen.set(false)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <nav class="drawer-nav">
            @for (tab of tabs; track tab.id) {
              <a class="drawer-item" [routerLink]="['/trips', tripId, tab.id]" routerLinkActive="active" (click)="drawerOpen.set(false)">
                <span class="drawer-icon" [innerHTML]="tab.icon"></span>
                <span class="drawer-label">{{ tab.label }}</span>
              </a>
            }
          </nav>
        </div>
      </div>
    }
  `,
  styles: [`
    /* Desktop sidebar nav */
    .mobile-bar { display: none; }
    .drawer-overlay { display: none; }
    .trip-nav { display: flex; flex-direction: column; gap: 2px; }

    .nav-item {
      display: flex; align-items: center; gap: 11px;
      padding: 9px 12px; border-radius: 8px;
      text-decoration: none; color: #cbd5e1;
      font-size: 0.875rem; font-weight: 500;
      transition: background 0.15s, color 0.15s;
    }
    .nav-item:hover { background: rgba(255,255,255,0.10); color: #f1f5f9; }
    .nav-item.active { background: rgba(59,130,246,0.18); color: #93c5fd; font-weight: 600; }
    .nav-item.active .nav-icon { color: #60a5fa; }
    .nav-icon { display: flex; align-items: center; flex-shrink: 0; }
    .nav-label { white-space: nowrap; }

    /* Mobile */
    .mobile-hamburger { display: none; }

    @media (max-width: 700px) {
      .trip-nav { display: none; }

      .mobile-hamburger {
        display: flex; align-items: center; justify-content: center;
        width: 38px; height: 38px; border-radius: 10px;
        background: rgba(255,255,255,0.08); border: none;
        color: #e2e8f0; cursor: pointer;
        transition: background 0.15s;
        flex-shrink: 0;
      }
      .mobile-hamburger:hover { background: rgba(255,255,255,0.15); }

      /* Drawer overlay */
      .drawer-overlay {
        display: flex; align-items: flex-end;
        position: fixed; inset: 0; z-index: 300;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(2px);
        animation: fadein 180ms ease;
      }
      @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }

      .drawer {
        width: 100%; background: #0f172a;
        border-radius: 20px 20px 0 0;
        padding: 0 0 env(safe-area-inset-bottom, 12px);
        animation: slideup 240ms cubic-bezier(0.32, 0.72, 0, 1);
      }
      @keyframes slideup {
        from { transform: translateY(100%); }
        to   { transform: translateY(0); }
      }

      .drawer-handle {
        width: 36px; height: 4px; border-radius: 2px;
        background: rgba(255,255,255,0.2);
        margin: 12px auto 0;
      }

      .drawer-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 20px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }
      .drawer-title { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
      .drawer-close {
        width: 30px; height: 30px; border-radius: 8px;
        background: rgba(255,255,255,0.08); border: none;
        color: #94a3b8; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
      }

      .drawer-nav { display: flex; flex-direction: column; padding: 8px 12px 16px; gap: 2px; }
      .drawer-item {
        display: flex; align-items: center; gap: 14px;
        padding: 13px 14px; border-radius: 12px;
        text-decoration: none; color: #cbd5e1;
        font-size: 0.95rem; font-weight: 500;
        transition: background 0.12s, color 0.12s;
      }
      .drawer-item:hover { background: rgba(255,255,255,0.08); color: #f1f5f9; }
      .drawer-item.active { background: rgba(59,130,246,0.18); color: #93c5fd; font-weight: 600; }
      .drawer-icon { display: flex; align-items: center; flex-shrink: 0; width: 20px; height: 20px; }
    }

    /* Force SVG stroke for innerHTML-injected icons */
    ::ng-deep .drawer-icon svg { stroke: #94a3b8; }
    ::ng-deep .drawer-item.active .drawer-icon svg { stroke: #60a5fa; }
  `],
})
export class TripTabsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  readonly tripId = this.route.snapshot.paramMap.get('tripId') ?? '';
  readonly drawerOpen = signal(false);
  readonly tabs: { id: TripTab; label: string; icon: SafeHtml }[] = TABS.map(t => ({
    ...t,
    icon: this.sanitizer.bypassSecurityTrustHtml(t.icon),
  }));
}
