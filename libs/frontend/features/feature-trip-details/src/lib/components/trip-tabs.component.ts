import { Component, inject } from '@angular/core';
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

    <!-- Bottom nav (mobile) -->
    <nav class="bottom-nav">
      <a class="bottom-back" routerLink="/trips">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        <span>Back</span>
      </a>
      @for (tab of tabs; track tab.id) {
        <a class="bottom-item" [routerLink]="['/trips', tripId, tab.id]" routerLinkActive="active">
          <span class="b-icon" [innerHTML]="tab.icon"></span>
          <span class="b-label">{{ tab.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    /* Desktop sidebar nav */
    .bottom-nav { display: none; }
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

    /* Mobile bottom nav */
    @media (max-width: 700px) {
      .trip-nav { display: none; }
      .bottom-nav {
        display: flex; align-items: stretch;
        width: 100%; overflow-x: auto; scrollbar-width: none;
      }
      .bottom-nav::-webkit-scrollbar { display: none; }

      .bottom-back {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 3px; padding: 6px 12px; min-width: 52px; flex-shrink: 0;
        text-decoration: none; color: #93c5fd;
        font-size: 0.58rem; font-weight: 700;
        border-right: 1px solid rgba(255,255,255,0.1);
      }

      .bottom-item {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 3px; padding: 6px 6px; flex: 1; min-width: 52px;
        text-decoration: none; color: #94a3b8;
        font-size: 0.56rem; font-weight: 500;
        transition: color 0.15s; white-space: nowrap;
      }
      .bottom-item.active { color: #60a5fa; }
      .b-icon { display: flex; align-items: center; color: inherit; }
      .b-label { display: none; }
      .bottom-back span { display: none; }
    }

    /* Force SVG stroke color for innerHTML-injected icons (bypasses encapsulation) */
    ::ng-deep .bottom-nav .b-icon svg { stroke: #94a3b8; }
    ::ng-deep .bottom-nav .bottom-item.active .b-icon svg { stroke: #60a5fa; }
    ::ng-deep .bottom-nav .bottom-back svg { stroke: #93c5fd; }
  `],
})
export class TripTabsComponent {
  private readonly route = inject(ActivatedRoute);

  readonly tripId = this.route.snapshot.paramMap.get('tripId') ?? '';
  readonly tabs = TABS;
}
