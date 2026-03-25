import { DatePipe, SlicePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { destinationPhotoBg } from '@org/util';
import { Destination } from '@org/util-types';
import { AddDestinationModalComponent } from '../components/add-destination-modal/add-destination-modal.component';
import { DestinationsStore } from '../store/destinations.store';

@Component({
  selector: 'lib-destinations-page',
  standalone: true,
  imports: [DatePipe, SlicePipe, TitleCasePipe, UpperCasePipe, AddDestinationModalComponent],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Itinerary</h1>
          @if (ordered().length > 0) {
            <div class="trip-stats">
              <span class="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
                {{ ordered().length }} destination{{ ordered().length !== 1 ? 's' : '' }}
              </span>
              <span class="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {{ totalDays() }} days total
              </span>
            </div>
          }
        </div>
        <button class="btn-add" (click)="showModal.set(true)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Destination
        </button>
      </div>

      <!-- Loading -->
      @if (store.loading()) {
        <div class="timeline">
          @for (s of skeletons; track s) {
            <div class="skeleton-card shimmer"></div>
          }
        </div>

      <!-- Empty state -->
      } @else if (ordered().length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.3">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          <p class="empty-title">No destinations yet</p>
          <p class="empty-desc">Start building your itinerary by adding your first destination.</p>
          <button class="btn-add btn-add--lg" (click)="showModal.set(true)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add First Destination
          </button>
        </div>

      <!-- Timeline -->
      } @else {
        <div class="timeline">
          @for (dest of ordered(); track dest.id; let i = $index; let last = $last) {

            <!-- Destination card -->
            <div class="dest-card card">
              <!-- Gradient left panel -->
              <div class="card-panel" [style.background]="cardBg(dest)">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8">
                  <circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
                <span class="panel-country">{{ dest.country | slice:0:3 | uppercase }}</span>
              </div>

              <!-- Card body -->
              <div class="card-body">
                <div class="card-title-row">
                  <h3 class="card-title">{{ dest.city | titlecase }}</h3>
                  <div class="card-title-right">
                    <span class="card-days-badge">{{ dayCount(dest) }} day{{ dayCount(dest) !== 1 ? 's' : '' }}</span>
                  </div>
                </div>
                <div class="card-country">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" class="pin-icon">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  {{ dest.country }}
                </div>
                <div class="card-dates">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {{ dest.startDate | date:'MMM d':'UTC' }} – {{ dest.endDate | date:'MMM d, y':'UTC' }}
                </div>
                @if (dest.notes) {
                  <p class="card-notes">{{ dest.notes }}</p>
                }
              </div>

              <!-- Overflow menu — right side -->
              <div class="card-menu-wrap" (click)="$event.stopPropagation()">
                <button class="btn-menu" [class.open]="menuOpenId() === dest.id" (click)="toggleMenu(dest.id)" title="Options">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                </button>
                @if (menuOpenId() === dest.id) {
                  <div class="card-dropdown">
                    <button class="dropdown-item" (click)="openEdit(dest); $event.stopPropagation()">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item dropdown-item--danger" (click)="deleteAndClose(dest.id); $event.stopPropagation()">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                }
              </div>
            </div>

            <!-- Route connector (between cards) -->
            @if (!last) {
              <div class="route-connector">
                <div class="connector-line"></div>
                <div class="connector-arrow">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                <div class="connector-line"></div>
              </div>
            }
          }

          <!-- Add next destination card -->
          <button class="add-card" (click)="showModal.set(true)">
            <div class="add-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <span class="add-card-label">Add next destination</span>
          </button>
        </div>
      }
    </div>

    @if (showModal()) {
      <lib-add-destination-modal (closed)="showModal.set(false); editingDest.set(null)" [destination]="editingDest()" />
    }
  `,
  styles: [`
    .page { padding: var(--space-2) 0; }

    /* Header */
    .header-left { display: flex; flex-direction: column; gap: 10px; }
    .trip-stats { display: flex; gap: var(--space-2); flex-wrap: wrap; }

    /* Timeline */
    .timeline { display: flex; flex-direction: column; }

    /* Destination card */
    .dest-card {
      position: relative;
      display: flex; flex-direction: row;
      transition: transform var(--transition-normal), box-shadow var(--transition-normal);
      cursor: default;
    }
    .dest-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.10); }

    /* Gradient left panel */
    .card-panel {
      width: 90px; flex-shrink: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: var(--space-2);
      padding: var(--space-5) var(--space-2);
      border-radius: 15px 0 0 15px;
      overflow: hidden;
    }
    .panel-country {
      font-size: 0.65rem; font-weight: var(--font-weight-extrabold); letter-spacing: var(--tracking-widest);
      color: rgba(255,255,255,0.85);
    }

    /* Overflow menu — right side */
    .card-menu-wrap {
      position: absolute; top: 12px; right: 12px;
      opacity: 0; transition: opacity var(--transition-fast);
    }
    .dest-card:hover .card-menu-wrap { opacity: 1; }

    .btn-menu {
      width: 28px; height: 28px;
      background: var(--color-surface-muted); border: none; border-radius: var(--radius-xs);
      cursor: pointer; color: var(--color-text-soft);
      display: flex; align-items: center; justify-content: center;
      transition: background var(--transition-fast), color var(--transition-fast);
    }
    .btn-menu:hover, .btn-menu.open { background: var(--color-border); color: var(--color-text); }

    .card-dropdown {
      position: absolute; top: calc(100% + 4px); right: 0;
      background: var(--color-surface); border-radius: var(--radius-lg);
      box-shadow: 0 8px 24px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08);
      border: 1px solid var(--color-border); min-width: 130px; z-index: 50;
      padding: 5px; animation: dropIn var(--transition-fast) ease;
    }
    .dropdown-item {
      display: flex; align-items: center; gap: var(--space-2);
      width: 100%; padding: var(--space-2) 11px;
      background: none; border: none; border-radius: var(--radius-xs);
      font-size: 0.84rem; font-weight: var(--font-weight-medium);
      cursor: pointer; text-align: left; transition: background var(--transition-fast);
    }
    .dropdown-item:not(.dropdown-item--danger) { color: var(--color-text-secondary); }
    .dropdown-item:not(.dropdown-item--danger):hover { background: var(--color-surface-subtle); }
    .dropdown-item--danger { color: #dc2626; }
    .dropdown-item--danger:hover { background: var(--color-danger-light); }
    .dropdown-divider { height: 1px; background: var(--color-surface-muted); margin: 3px 5px; }

    /* Card body */
    .card-body { padding: var(--space-5) 44px var(--space-5) var(--space-5); flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 6px; }

    .card-title-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 10px; margin-bottom: 2px;
    }
    .card-title {
      margin: 0; font-size: 1.1rem; font-weight: var(--font-weight-extrabold); color: var(--color-text);
      letter-spacing: var(--tracking-tight); line-height: 1.2;
    }
    .card-title-right { display: flex; align-items: center; gap: var(--space-2); }

    .card-days-badge {
      display: inline-flex; align-items: center;
      font-size: 0.72rem; font-weight: var(--font-weight-bold);
      background: #eef2ff; color: #6366f1;
      border: 1px solid #e0e7ff;
      padding: 2px 9px; border-radius: var(--radius-3xl);
    }

    .card-country {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.75rem; font-weight: var(--font-weight-bold); color: var(--color-text-subtle);
      text-transform: uppercase; letter-spacing: var(--tracking-wide);
    }
    .pin-icon { color: var(--color-action); flex-shrink: 0; }

    .card-dates {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.82rem; color: var(--color-text-soft);
    }
    .card-dates svg { flex-shrink: 0; color: var(--color-text-subtle); }

    .card-notes {
      margin: 2px 0 0;
      font-size: 0.79rem; color: var(--color-text-subtle); line-height: var(--leading-normal);
      display: -webkit-box; -webkit-line-clamp: 1;
      -webkit-box-orient: vertical; overflow: hidden;
    }

    /* Route connector */
    .route-connector {
      display: flex; flex-direction: column; align-items: center;
      padding: 0; gap: 0; margin-left: 44px;
    }
    .connector-line { width: 2px; height: 12px; background: var(--color-border); }
    .connector-arrow {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--color-surface); border: 1px solid var(--color-border);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    /* Add card */
    .add-card {
      margin-top: var(--space-3);
      display: flex; align-items: center; gap: 14px;
      background: none; border: 2px dashed var(--color-border);
      border-radius: 14px; padding: 14px var(--space-5);
      cursor: pointer; width: 100%;
      transition: border-color var(--transition-fast), background var(--transition-fast);
    }
    .add-card:hover { border-color: #93c5fd; background: #f0f9ff; }
    .add-card-icon {
      width: 36px; height: 36px; border-radius: var(--radius-lg);
      background: var(--color-surface-muted);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background var(--transition-fast);
    }
    .add-card:hover .add-card-icon { background: #dbeafe; }
    .add-card:hover .add-card-icon svg { stroke: var(--color-action); }
    .add-card-label { font-size: var(--font-size-body); font-weight: var(--font-weight-semibold); color: var(--color-text-subtle); transition: color var(--transition-fast); }
    .add-card:hover .add-card-label { color: var(--color-action); }

    /* Skeleton */
    .skeleton-card {
      height: 150px; border-radius: var(--radius-2xl); margin-bottom: var(--space-3);
    }

    @media (max-width: 600px) {
      .page { padding: var(--space-2) 0; }
      /* Compact header */
      .page-header { margin-bottom: 18px; align-items: center; }
      .page-title { font-size: 1.15rem; }
      .trip-stats { gap: 6px; }
      .btn-add { padding: var(--space-2) var(--space-3); font-size: 0.8rem; gap: 5px; }

      /* Narrower gradient panel */
      .card-panel { width: 70px; padding: var(--space-4) 6px; }
      .card-body { padding: 14px 40px 14px 14px; gap: 4px; }
      .card-title { font-size: 0.95rem; }
      .card-dates { font-size: var(--font-size-caption); }

      /* Always show overflow menu on touch (no hover) */
      .card-menu-wrap { opacity: 1; }

      /* Route connector alignment */
      .route-connector { margin-left: 34px; }
    }
  `],
})
export class DestinationsPageComponent implements OnInit {
  readonly store = inject(DestinationsStore);

  readonly showModal = signal(false);
  readonly editingDest = signal<Destination | null>(null);
  readonly menuOpenId = signal<string | null>(null);
  readonly skeletons = [1, 2, 3];

  readonly ordered = computed<Destination[]>(() => this.store.rawDestinations());

  readonly totalDays = computed(() =>
    this.ordered().reduce((sum, d) => sum + this.dayCount(d), 0)
  );

  ngOnInit(): void {
    document.addEventListener('click', () => this.menuOpenId.set(null));
  }

  toggleMenu(id: string): void {
    this.menuOpenId.set(this.menuOpenId() === id ? null : id);
  }

  openEdit(dest: Destination): void {
    this.editingDest.set(dest);
    this.showModal.set(true);
    this.menuOpenId.set(null);
  }

  deleteAndClose(id: string): void {
    this.store.deleteDestination(id);
    this.menuOpenId.set(null);
  }

  // Helpers
  cardBg(dest: Destination): string {
    return destinationPhotoBg(dest.city);
  }

  dayCount(dest: Destination): number {
    const ms = new Date(dest.endDate).getTime() - new Date(dest.startDate).getTime();
    return Math.max(1, Math.round(ms / 86400000) + 1);
  }

}
