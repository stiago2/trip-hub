import { DatePipe, SlicePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Destination } from '@org/util-types';
import { AddDestinationModalComponent } from '../components/add-destination-modal/add-destination-modal.component';
import { DestinationsStore } from '../store/destinations.store';

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #fda085 0%, #f6d365 100%)',
  'linear-gradient(135deg, #373b44 0%, #4286f4 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
];

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
            <div
              class="dest-card"
              [class.is-dragging]="draggingId() === dest.id"
              [class.is-drag-over]="dragOverId() === dest.id"
              draggable="true"
              (dragstart)="onDragStart(dest.id)"
              (dragover)="onDragOver(dest.id, $event)"
              (dragleave)="dragOverId.set(null)"
              (drop)="onDrop(dest.id)"
              (dragend)="draggingId.set(null); dragOverId.set(null)"
            >
              <!-- Drag handle -->
              <div class="drag-handle" title="Drag to reorder">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                  <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/>
                </svg>
              </div>

              <!-- Gradient left panel -->
              <div class="card-panel" [style.background]="gradient(dest)">
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
                    <span class="order-badge">{{ i + 1 }}</span>
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
                  {{ dest.startDate | date:'MMM d' }} – {{ dest.endDate | date:'MMM d, y' }}
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
    .page { padding: 8px 0; }

    /* Header */
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

    /* Timeline */
    .timeline { display: flex; flex-direction: column; }

    /* Destination card */
    .dest-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
      border: 1px solid #e8edf3;
      position: relative;
      display: flex; flex-direction: row;
      transition: transform 0.18s, box-shadow 0.18s;
      cursor: default;
    }
    .dest-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.10); }
    .dest-card.is-dragging { opacity: 0.45; transform: scale(0.98); }
    .dest-card.is-drag-over {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.25);
    }

    /* Drag handle */
    .drag-handle {
      position: absolute; left: -24px; top: 50%; transform: translateY(-50%);
      width: 18px; height: 30px;
      display: flex; align-items: center; justify-content: center;
      cursor: grab; opacity: 0; transition: opacity 0.15s;
      border-radius: 4px;
    }
    .dest-card:hover .drag-handle { opacity: 1; }
    .drag-handle:active { cursor: grabbing; }

    /* Gradient left panel */
    .card-panel {
      width: 90px; flex-shrink: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 8px;
      padding: 20px 8px;
      border-radius: 15px 0 0 15px;
      overflow: hidden;
    }
    .panel-country {
      font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em;
      color: rgba(255,255,255,0.85);
    }

    /* Overflow menu — right side */
    .card-menu-wrap {
      position: absolute; top: 12px; right: 12px;
      opacity: 0; transition: opacity 0.15s;
    }
    .dest-card:hover .card-menu-wrap { opacity: 1; }

    .btn-menu {
      width: 28px; height: 28px;
      background: #f1f5f9; border: none; border-radius: 7px;
      cursor: pointer; color: #64748b;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .btn-menu:hover, .btn-menu.open { background: #e2e8f0; color: #0f172a; }

    .card-dropdown {
      position: absolute; top: calc(100% + 4px); right: 0;
      background: white; border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0; min-width: 130px; z-index: 50;
      padding: 5px; animation: dropIn 120ms ease;
    }
    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .dropdown-item {
      display: flex; align-items: center; gap: 8px;
      width: 100%; padding: 8px 11px;
      background: none; border: none; border-radius: 7px;
      font-size: 0.84rem; font-weight: 500;
      cursor: pointer; text-align: left; transition: background 0.12s;
    }
    .dropdown-item:not(.dropdown-item--danger) { color: #374151; }
    .dropdown-item:not(.dropdown-item--danger):hover { background: #f8fafc; }
    .dropdown-item--danger { color: #dc2626; }
    .dropdown-item--danger:hover { background: #fef2f2; }
    .dropdown-divider { height: 1px; background: #f1f5f9; margin: 3px 5px; }

    /* Card body */
    .card-body { padding: 20px 44px 20px 20px; flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 6px; }

    .card-title-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 10px; margin-bottom: 2px;
    }
    .card-title {
      margin: 0; font-size: 1.1rem; font-weight: 800; color: #0f172a;
      letter-spacing: -0.02em; line-height: 1.2;
    }
    .card-title-right { display: flex; align-items: center; gap: 8px; }

    .order-badge {
      flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%;
      background: #0f172a; color: white;
      font-size: 0.7rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .card-days-badge {
      display: inline-flex; align-items: center;
      font-size: 0.72rem; font-weight: 700;
      background: #eef2ff; color: #6366f1;
      border: 1px solid #e0e7ff;
      padding: 2px 9px; border-radius: 20px;
    }

    .card-country {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.75rem; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.07em;
    }
    .pin-icon { color: #3b82f6; flex-shrink: 0; }

    .card-dates {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.82rem; color: #64748b;
    }
    .card-dates svg { flex-shrink: 0; color: #94a3b8; }

    .card-notes {
      margin: 2px 0 0;
      font-size: 0.79rem; color: #94a3b8; line-height: 1.4;
      display: -webkit-box; -webkit-line-clamp: 1;
      -webkit-box-orient: vertical; overflow: hidden;
    }

    /* Route connector */
    .route-connector {
      display: flex; flex-direction: column; align-items: center;
      padding: 0; gap: 0; margin-left: 44px;
    }
    .connector-line { width: 2px; height: 12px; background: #e2e8f0; }
    .connector-arrow {
      width: 28px; height: 28px; border-radius: 50%;
      background: white; border: 1px solid #e2e8f0;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    /* Add card */
    .add-card {
      margin-top: 12px;
      display: flex; align-items: center; gap: 14px;
      background: none; border: 2px dashed #e2e8f0;
      border-radius: 14px; padding: 14px 20px;
      cursor: pointer; width: 100%;
      transition: border-color 0.15s, background 0.15s;
    }
    .add-card:hover { border-color: #93c5fd; background: #f0f9ff; }
    .add-card-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background 0.15s;
    }
    .add-card:hover .add-card-icon { background: #dbeafe; }
    .add-card:hover .add-card-icon svg { stroke: #3b82f6; }
    .add-card-label { font-size: 0.875rem; font-weight: 600; color: #94a3b8; transition: color 0.15s; }
    .add-card:hover .add-card-label { color: #3b82f6; }

    /* Empty state */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 10px; padding: 80px 24px; text-align: center;
    }
    .empty-icon-wrap {
      width: 72px; height: 72px; border-radius: 20px;
      background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 8px;
    }
    .empty-title { margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a; }
    .empty-desc { margin: 0; font-size: 0.875rem; color: #94a3b8; max-width: 300px; }

    /* Skeleton */
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .shimmer {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease infinite;
    }
    .skeleton-card {
      height: 150px; border-radius: 16px; margin-bottom: 12px;
    }

    @media (max-width: 600px) {
      .page { padding: 8px 0; }
      .drag-handle { display: none; }

      /* Compact header */
      .page-header { margin-bottom: 18px; align-items: center; }
      .page-title { font-size: 1.15rem; }
      .trip-stats { gap: 6px; }
      .btn-add { padding: 8px 12px; font-size: 0.8rem; gap: 5px; }

      /* Narrower gradient panel */
      .card-panel { width: 70px; padding: 16px 6px; }
      .card-body { padding: 14px 40px 14px 14px; gap: 4px; }
      .card-title { font-size: 0.95rem; }
      .card-dates { font-size: 0.78rem; }

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
  readonly draggingId = signal<string | null>(null);
  readonly dragOverId = signal<string | null>(null);
  readonly localOrder = signal<string[]>([]);
  readonly skeletons = [1, 2, 3];

  // Maintain local ordering, falling back to store order on first load
  readonly ordered = computed<Destination[]>(() => {
    const dests = this.store.destinations();
    const order = this.localOrder();
    if (order.length === 0) return dests;
    const ordered = order.map(id => dests.find(d => d.id === id)).filter(Boolean) as Destination[];
    const added = dests.filter(d => !order.includes(d.id));
    return [...ordered, ...added];
  });

  readonly totalDays = computed(() =>
    this.ordered().reduce((sum, d) => sum + this.dayCount(d), 0)
  );

  ngOnInit(): void {
    document.addEventListener('click', () => this.menuOpenId.set(null));
  }

  // Drag & drop
  onDragStart(id: string): void {
    this.draggingId.set(id);
    if (this.localOrder().length === 0) {
      this.localOrder.set(this.ordered().map(d => d.id));
    }
  }

  onDragOver(id: string, event: DragEvent): void {
    event.preventDefault();
    if (this.draggingId() !== id) this.dragOverId.set(id);
  }

  onDrop(targetId: string): void {
    const fromId = this.draggingId();
    if (!fromId || fromId === targetId) return;
    const order = this.localOrder().length
      ? [...this.localOrder()]
      : this.ordered().map(d => d.id);
    const fromIdx = order.indexOf(fromId);
    const toIdx = order.indexOf(targetId);
    order.splice(fromIdx, 1);
    order.splice(toIdx, 0, fromId);
    this.localOrder.set(order);
    this.draggingId.set(null);
    this.dragOverId.set(null);
  }

  // Menu
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
    this.localOrder.update(order => order.filter(o => o !== id));
    this.menuOpenId.set(null);
  }

  // Helpers
  gradient(dest: Destination): string {
    return CARD_GRADIENTS[dest.city.charCodeAt(0) % CARD_GRADIENTS.length];
  }

  dayCount(dest: Destination): number {
    const ms = new Date(dest.endDate).getTime() - new Date(dest.startDate).getTime();
    return Math.max(1, Math.round(ms / 86400000) + 1);
  }

}
