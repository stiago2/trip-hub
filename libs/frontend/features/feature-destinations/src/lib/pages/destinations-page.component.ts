import { DatePipe, LowerCasePipe, SlicePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { destinationPhotoBg } from '@org/util';
import { Destination } from '@org/util-types';
import { CreateActivityPayload } from '@org/data-access-trips';
import { AddDestinationModalComponent } from '../components/add-destination-modal/add-destination-modal.component';
import { DestinationsStore } from '../store/destinations.store';
import { DestinationActivitiesStore } from '../store/destination-activities.store';

@Component({
  selector: 'lib-destinations-page',
  standalone: true,
  imports: [DatePipe, SlicePipe, TitleCasePipe, UpperCasePipe, LowerCasePipe, AddDestinationModalComponent],
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
            <div class="dest-card card" [class.is-expanded]="expandedId() === dest.id">
              <!-- Gradient left panel -->
              <div class="card-panel" [style.background]="cardBg(dest)">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.8">
                  <circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
                <span class="panel-country">{{ dest.country | slice:0:3 | uppercase }}</span>
              </div>

              <!-- Card body (clickable to expand) -->
              <div class="card-body" (click)="toggleExpand(dest.id)" style="cursor:pointer">
                <div class="card-title-row">
                  <h3 class="card-title">{{ dest.city | titlecase }}</h3>
                  <div class="card-title-right">
                    <span class="card-days-badge">{{ dayCount(dest) }} day{{ dayCount(dest) !== 1 ? 's' : '' }}</span>
                    <svg class="expand-chevron" [class.rotated]="expandedId() === dest.id"
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
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

              <!-- Activities section (expanded) -->
              @if (expandedId() === dest.id) {
                <div class="activities-panel" role="presentation" (click)="$event.stopPropagation()">
                  <div class="activities-header">
                    <span class="activities-title">Activities</span>
                    <div class="activities-header-actions">
                      <button
                        class="btn-suggest"
                        (click)="activitiesStore.suggestActivities(dest.id)"
                        [disabled]="activitiesStore.suggestingIds().includes(dest.id)"
                        title="Get AI suggestions"
                      >
                        @if (activitiesStore.suggestingIds().includes(dest.id)) {
                          <span class="suggest-spinner"></span> Thinking...
                        } @else {
                          ✨ Suggest
                        }
                      </button>
                      <span class="activities-count">
                        {{ (activitiesStore.activitiesByDestination()[dest.id] ?? []).length }} planned
                      </span>
                    </div>
                  </div>

                  @if (activitiesStore.loadingIds().includes(dest.id)) {
                    <p class="activities-loading">Loading...</p>
                  } @else {
                    <ul class="activity-list">
                      @for (act of activitiesStore.activitiesByDestination()[dest.id] ?? []; track act.id) {
                        <li class="activity-item" [class.done]="act.done">
                          <button class="act-check" (click)="activitiesStore.toggleDone(dest.id, act.id)" [class.checked]="act.done">
                            @if (act.done) {
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                            }
                          </button>
                          <span class="act-category-dot act-dot--{{ act.category | lowercase }}"></span>
                          <span class="act-name">{{ act.name }}</span>
                          <button class="act-delete" (click)="activitiesStore.deleteActivity(dest.id, act.id)" title="Remove">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </li>
                      }
                      @if ((activitiesStore.activitiesByDestination()[dest.id] ?? []).length === 0) {
                        <li class="activity-empty">No activities yet. Add one below.</li>
                      }
                    </ul>

                    <!-- AI Suggestions -->
                    <div class="suggestions-section" role="presentation" (click)="$event.stopPropagation()">
                      @if (activitiesStore.suggestionsByDestination()[dest.id]?.length) {
                        <div class="suggestions-header">
                          <span class="suggestions-label">✨ AI Suggestions</span>
                          <button class="suggestions-dismiss" (click)="activitiesStore.clearSuggestions(dest.id)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                        <div class="suggestion-list">
                          @for (s of activitiesStore.suggestionsByDestination()[dest.id]; track s.name) {
                            <div class="suggestion-chip">
                              <span class="suggestion-dot act-dot--{{ s.category | lowercase }}"></span>
                              <div class="suggestion-info">
                                <span class="suggestion-name">{{ s.name }}</span>
                                <span class="suggestion-reason">{{ s.reason }}</span>
                              </div>
                              <button class="suggestion-add" (click)="addSuggestion(dest.id, s)" title="Add to activities">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              </button>
                            </div>
                          }
                        </div>
                      }
                    </div>

                    <!-- Add activity form -->
                    <div class="add-activity-form" role="presentation" (click)="$event.stopPropagation()">
                      <select class="act-category-select" [value]="newActivityCategory()" (change)="newActivityCategory.set($any($event.target).value)">
                        @for (cat of CATEGORIES; track cat.value) {
                          <option [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option>
                        }
                      </select>
                      <input
                        class="act-name-input"
                        type="text"
                        placeholder="Add an activity..."
                        [value]="newActivityName()"
                        (input)="newActivityName.set($any($event.target).value)"
                        (keydown.enter)="addActivity(dest.id)"
                      />
                      <button class="act-add-btn" (click)="addActivity(dest.id)" [disabled]="!newActivityName().trim()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                    </div>
                  }
                </div>
              }
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
      position: relative; display: flex; flex-direction: row; flex-wrap: wrap;
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

    /* Expand chevron */
    .expand-chevron { transition: transform var(--transition-fast); flex-shrink: 0; }
    .expand-chevron.rotated { transform: rotate(180deg); }

    /* Activities panel */
    .activities-panel {
      width: 100%;
      border-top: 1px solid var(--color-surface-muted);
      padding: var(--space-4) var(--space-5);
      background: var(--color-surface-subtle);
      border-radius: 0 0 15px 15px;
    }
    .activities-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: var(--space-3);
    }
    .activities-title { font-size: 0.78rem; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--color-text-subtle); }
    .activities-count { font-size: 0.75rem; color: var(--color-text-subtle); }
    .activities-loading { font-size: 0.82rem; color: var(--color-text-subtle); padding: var(--space-2) 0; }

    /* Activity list */
    .activity-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--space-3); }
    .activity-item {
      display: flex; align-items: center; gap: var(--space-2);
      padding: 7px 10px; border-radius: var(--radius-lg);
      background: var(--color-surface); border: 1px solid var(--color-border);
      transition: background var(--transition-fast);
    }
    .activity-item.done { opacity: 0.55; }
    .activity-item.done .act-name { text-decoration: line-through; color: var(--color-text-subtle); }

    .act-check {
      width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
      border: 2px solid var(--color-border); background: var(--color-surface);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: border-color var(--transition-fast), background var(--transition-fast);
    }
    .act-check.checked { background: #22c55e; border-color: #22c55e; color: white; }

    .act-category-dot {
      width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
    }
    .act-dot--culture   { background: #6366f1; }
    .act-dot--food      { background: #f59e0b; }
    .act-dot--nature    { background: #22c55e; }
    .act-dot--nightlife { background: #8b5cf6; }
    .act-dot--shopping  { background: #ec4899; }
    .act-dot--other     { background: #94a3b8; }

    .act-name { flex: 1; font-size: 0.85rem; color: var(--color-text); font-weight: var(--font-weight-medium); }

    .act-delete {
      background: none; border: none; color: var(--color-text-dim); cursor: pointer;
      padding: 2px; border-radius: 4px; display: flex; align-items: center;
      opacity: 0; transition: opacity var(--transition-fast), color var(--transition-fast);
    }
    .activity-item:hover .act-delete { opacity: 1; }
    .act-delete:hover { color: var(--color-danger); }

    .activity-empty { font-size: 0.82rem; color: var(--color-text-subtle); padding: var(--space-2) 0; text-align: center; }

    /* Add activity form */
    .add-activity-form {
      display: flex; gap: var(--space-2); align-items: center;
    }
    .act-category-select {
      padding: 7px var(--space-2); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); font-size: 0.8rem; background: var(--color-surface);
      color: var(--color-text); cursor: pointer; outline: none; flex-shrink: 0;
    }
    .act-name-input {
      flex: 1; padding: 7px var(--space-3); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); font-size: 0.85rem; background: var(--color-surface);
      color: var(--color-text); outline: none;
    }
    .act-name-input:focus { border-color: var(--color-action); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .act-name-input::placeholder { color: var(--color-text-dim); }
    .act-add-btn {
      width: 34px; height: 34px; flex-shrink: 0; border-radius: var(--radius-lg);
      background: var(--color-action); border: none; color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background var(--transition-fast);
    }
    .act-add-btn:hover:not(:disabled) { background: var(--color-action-hover); }
    .act-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

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

    /* Suggest button */
    .activities-header-actions { display: flex; align-items: center; gap: var(--space-3); }
    .btn-suggest {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: var(--radius-full);
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; border: none; font-size: 0.75rem; font-weight: var(--font-weight-semibold);
      cursor: pointer; transition: opacity var(--transition-fast), transform var(--transition-fast);
      white-space: nowrap;
    }
    .btn-suggest:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-suggest:disabled { opacity: 0.6; cursor: not-allowed; }
    .suggest-spinner {
      width: 10px; height: 10px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.7s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Suggestions section */
    .suggestions-section { margin-bottom: var(--space-3); }
    .suggestions-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: var(--space-2);
    }
    .suggestions-label { font-size: 0.75rem; font-weight: var(--font-weight-semibold); color: #6366f1; }
    .suggestions-dismiss {
      background: none; border: none; color: var(--color-text-subtle); cursor: pointer;
      padding: 2px; border-radius: 4px; display: flex; align-items: center;
    }
    .suggestions-dismiss:hover { color: var(--color-text); }

    .suggestion-list { display: flex; flex-direction: column; gap: 6px; }
    .suggestion-chip {
      display: flex; align-items: center; gap: var(--space-2);
      padding: 8px 10px; border-radius: var(--radius-lg);
      background: linear-gradient(135deg, #f5f3ff, #ede9fe);
      border: 1px solid #ddd6fe;
      transition: background var(--transition-fast);
    }
    .suggestion-dot {
      width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
    }
    .suggestion-info { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .suggestion-name { font-size: 0.85rem; font-weight: var(--font-weight-semibold); color: var(--color-text); }
    .suggestion-reason { font-size: 0.75rem; color: var(--color-text-subtle); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .suggestion-add {
      width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%;
      background: #6366f1; border: none; color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background var(--transition-fast), transform var(--transition-fast);
    }
    .suggestion-add:hover { background: #4f46e5; transform: scale(1.1); }
  `],
})
export class DestinationsPageComponent implements OnInit {
  readonly store = inject(DestinationsStore);
  readonly activitiesStore = inject(DestinationActivitiesStore);

  readonly showModal = signal(false);
  readonly editingDest = signal<Destination | null>(null);
  readonly menuOpenId = signal<string | null>(null);
  readonly expandedId = signal<string | null>(null);
  readonly newActivityName = signal('');
  readonly newActivityCategory = signal('CULTURE');
  readonly skeletons = [1, 2, 3];

  readonly CATEGORIES = [
    { value: 'CULTURE', label: 'Culture', icon: '🏛' },
    { value: 'FOOD', label: 'Food', icon: '🍜' },
    { value: 'NATURE', label: 'Nature', icon: '🌿' },
    { value: 'NIGHTLIFE', label: 'Nightlife', icon: '🌙' },
    { value: 'SHOPPING', label: 'Shopping', icon: '🛍' },
    { value: 'OTHER', label: 'Other', icon: '📌' },
  ];

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

  toggleExpand(destId: string): void {
    if (this.expandedId() === destId) {
      this.expandedId.set(null);
    } else {
      this.expandedId.set(destId);
      this.activitiesStore.loadActivities(destId);
      this.newActivityName.set('');
      this.newActivityCategory.set('CULTURE');
    }
  }

  addSuggestion(destinationId: string, suggestion: { name: string; category: string }): void {
    this.activitiesStore.createActivity(destinationId, { name: suggestion.name, category: suggestion.category });
  }

  addActivity(destinationId: string): void {
    const name = this.newActivityName().trim();
    if (!name) return;
    this.activitiesStore.createActivity(
      destinationId,
      { name, category: this.newActivityCategory() } as CreateActivityPayload,
      () => { this.newActivityName.set(''); }
    );
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
