import { DatePipe, SlicePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, AuthStore } from '@org/feature-auth';
import { Trip } from '@org/util-types';
import { CreateTripModalComponent } from '../components/create-trip-modal/create-trip-modal.component';
import { TripsStore } from '../store/trips.store';
import { getTripStatus, getTripTimeInfo } from '../utils/trip-status';
import { getTripColor } from '../utils/trip-color';

type FilterTab = 'all' | 'upcoming' | 'active' | 'past';

@Component({
  selector: 'lib-trips-page',
  standalone: true,
  imports: [DatePipe, SlicePipe, TitleCasePipe, UpperCasePipe, CreateTripModalComponent],
  template: `
    <div class="trips-shell">

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2">
              <circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
          </div>
          <span class="brand-name">TripHub</span>
        </div>

        <nav class="sidebar-nav">
          <a class="nav-item active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="3" width="7" height="7" rx="1"/><rect x="2" y="14" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/></svg>
            My Trips
          </a>
        </nav>

        <div class="sidebar-footer">
          @if (authStore.user()) {
            <div class="user-row">
              <div class="user-avatar">
                {{ (authStore.user()!.name || authStore.user()!.email) | slice:0:1 | uppercase }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ authStore.user()!.name || authStore.user()!.email }}</span>
                <span class="user-plan">Premium Member</span>
              </div>
              <button class="logout-icon-btn" title="Sign out" (click)="logout()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          }
        </div>
      </aside>

      <!-- Main -->
      <div class="main">

        <!-- Page header -->
        <div class="page-header">
          <div class="header-left">
            <h1 class="page-title">My Trips</h1>
            <span class="trips-summary">{{ tripsSummary() }}</span>
          </div>
          <div class="header-right">
            <div class="search-wrap">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                class="search-input"
                type="text"
                placeholder="Search trips..."
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
              />
            </div>
            <button class="btn-create" (click)="showModal.set(true)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create New Trip
            </button>
          </div>
        </div>

        <!-- Filter tabs -->
        <div class="filter-bar">
          <nav class="filter-tabs">
            @for (tab of tabsWithCounts(); track tab.id) {
              <button
                class="filter-tab"
                [class.active]="activeFilter() === tab.id"
                (click)="activeFilter.set(tab.id)"
              >{{ tab.label }} ({{ tab.count }})</button>
            }
          </nav>
        </div>

        <!-- Content -->
        <div class="content">
          @if (store.loading()) {
            <div class="trips-grid">
              @for (n of skeletons; track n) {
                <div class="trip-card trip-card--skeleton">
                  <div class="skeleton-cover"></div>
                  <div class="skeleton-body">
                    <div class="skeleton-line skeleton-line--title"></div>
                    <div class="skeleton-line skeleton-line--dates"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (store.trips().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <h3 class="empty-title">No trips yet</h3>
              <p class="empty-text">Create your first trip to start planning your adventure</p>
              <button class="btn-empty-create" (click)="showModal.set(true)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create Trip
              </button>
            </div>
          } @else {
            <div class="trips-grid">

              @for (trip of filteredTrips(); track trip.id) {
                <article class="trip-card" (click)="onTripClick(trip.id)">

                  <!-- Thin accent bar -->
                  <div class="card-accent" [style.background]="getTripColor(trip.id)"></div>

                  <!-- Overflow menu -->
                  <div class="card-menu-wrap" (click)="$event.stopPropagation()">
                    <button
                      class="btn-menu"
                      [class.open]="openMenuId() === trip.id"
                      (click)="toggleMenu(trip.id)"
                      title="Options"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                    </button>
                    @if (openMenuId() === trip.id) {
                      <div class="card-dropdown">
                        <button class="dropdown-item" (click)="editingTrip.set(trip); closeMenu()">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Edit Trip
                        </button>
                        <div class="dropdown-divider"></div>
                        <button class="dropdown-item dropdown-item--danger" (click)="closeMenu()">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          Delete Trip
                        </button>
                      </div>
                    }
                  </div>

                  <!-- Body -->
                  <div class="card-body">
                    <div class="card-title-row">
                      <h3 class="card-title">{{ trip.title | titlecase }}</h3>
                      <span class="status-badge badge--{{ getStatus(trip) }}">{{ getStatus(trip) | titlecase }}</span>
                    </div>
                    <div class="card-dates">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {{ trip.startDate | date:'MMM d' }} – {{ trip.endDate | date:'MMM d, yyyy' }}
                    </div>
                    <p class="card-time-info">{{ getTimeInfo(trip) }}</p>
                    @if (trip.description) {
                      <p class="card-description">{{ trip.description }}</p>
                    }
                    <div class="card-meta">
                      <span class="meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        0 destinations
                      </span>
                      <span class="meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        0 stays
                      </span>
                      <span class="meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="1"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
                        0 transports
                      </span>
                    </div>
                  </div>
                </article>
              }

              <!-- Create Trip card: only on All tab -->
              @if (activeFilter() === 'all') {
                <article class="new-trip-card" tabindex="0" (click)="showModal.set(true)" (keydown.enter)="showModal.set(true)" (keydown.space)="showModal.set(true)">
                  <div class="new-trip-inner">
                    <div class="new-trip-plus">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                    <span class="new-trip-label">+ Create Trip</span>
                    <span class="new-trip-sub">Plan your next adventure</span>
                  </div>
                </article>
              }

            </div>

            <!-- Filtered empty state (only for non-all tabs with no results) -->
            @if (filteredTrips().length === 0) {
              <div class="filtered-empty">
                @if (searchQuery()) {
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <p class="filtered-empty-title">No results found</p>
                  <p class="filtered-empty-sub">No trips match "{{ searchQuery() }}"</p>
                  <button class="filtered-clear-btn" (click)="clearFilters()">Clear search</button>
                } @else if (activeFilter() === 'active') {
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <p class="filtered-empty-title">No active trips</p>
                  <p class="filtered-empty-sub">You have no trips happening right now.</p>
                } @else if (activeFilter() === 'upcoming') {
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <p class="filtered-empty-title">No upcoming trips</p>
                  <p class="filtered-empty-sub">Plan your next adventure and it will appear here.</p>
                } @else if (activeFilter() === 'past') {
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <p class="filtered-empty-title">No past trips yet</p>
                  <p class="filtered-empty-sub">Your completed trips will appear here.</p>
                }
              </div>
            }
          }
        </div>
      </div>
    </div>

    @if (showModal()) {
      <lib-create-trip-modal (closed)="showModal.set(false)" />
    }
    @if (editingTrip()) {
      <lib-create-trip-modal [trip]="editingTrip()" (closed)="editingTrip.set(null)" />
    }
  `,
  styles: [`
    /* Shell */
    .trips-shell {
      display: flex; height: 100vh; overflow: hidden; background: #f1f5f9;
    }

    /* Sidebar */
    .sidebar {
      width: 220px; flex-shrink: 0;
      background: #0f172a; border-right: none;
      display: flex; flex-direction: column; padding: 16px 12px;
    }

    .brand {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 14px;
    }
    .brand-icon {
      width: 34px; height: 34px; border-radius: 10px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(99,102,241,0.4);
    }
    .brand-name { font-size: 1rem; font-weight: 700; color: #f8fafc; letter-spacing: -0.01em; }

    .sidebar-nav { flex: 1; }

    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 9px;
      font-size: 0.875rem; font-weight: 500; color: #94a3b8;
      text-decoration: none; cursor: pointer;
      border: none; background: none; width: 100%;
      transition: background 0.15s, color 0.15s;
    }
    .nav-item:hover { background: rgba(255,255,255,0.07); color: #e2e8f0; }
    .nav-item.active { background: rgba(59,130,246,0.18); color: #93c5fd; font-weight: 600; }
    .sidebar-footer {
      border-top: 1px solid rgba(255,255,255,0.08);
      padding-top: 12px;
      display: flex; flex-direction: column; gap: 4px;
    }

    .user-row {
      display: flex; align-items: center; gap: 9px;
      padding: 10px; margin-top: 6px; border-radius: 10px;
      background: rgba(255,255,255,0.06);
    }
    .user-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #6366f1); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.82rem; font-weight: 700; flex-shrink: 0;
    }
    .user-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .user-name { font-size: 0.8rem; font-weight: 600; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-plan { font-size: 0.72rem; color: #475569; }
    .logout-icon-btn {
      background: none; border: none; cursor: pointer;
      color: #475569; padding: 4px; border-radius: 6px;
      display: flex; align-items: center; transition: color 0.15s;
    }
    .logout-icon-btn:hover { color: #f87171; }

    /* Main */
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    /* Page header */
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 22px 28px 18px;
      background: white; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
    }
    .page-title { margin: 0 0 3px; font-size: 1.6rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .trips-summary { font-size: 0.83rem; color: #64748b; }

    .header-right { display: flex; align-items: center; gap: 12px; }

    .search-wrap { position: relative; display: flex; align-items: center; }
    .search-icon { position: absolute; left: 12px; pointer-events: none; }
    .search-input {
      padding: 9px 14px 9px 36px;
      border: 1px solid #e2e8f0; border-radius: 10px;
      font-size: 0.875rem; color: #1e293b; outline: none;
      background: #f8fafc; width: 210px;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    }
    .search-input:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .search-input::placeholder { color: #94a3b8; }

    .btn-create {
      display: flex; align-items: center; gap: 7px;
      background: #2563eb; color: white; border: none;
      padding: 9px 18px; border-radius: 10px; cursor: pointer;
      font-size: 0.875rem; font-weight: 600; white-space: nowrap;
      transition: background 0.15s;
    }
    .btn-create:hover { background: #1d4ed8; }

    /* Filter bar */
    .filter-bar {
      padding: 14px 28px;
      background: white; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
    }
    .filter-tabs { display: flex; gap: 6px; }
    .filter-tab {
      padding: 7px 16px;
      background: none; border: none; border-radius: 99px;
      font-size: 0.855rem; font-weight: 500; color: #64748b;
      cursor: pointer; transition: background 0.15s, color 0.15s;
    }
    .filter-tab:hover { background: #f1f5f9; color: #334155; }
    .filter-tab.active {
      background: #2563eb; color: white; font-weight: 600;
    }

    /* Content */
    .content { flex: 1; overflow-y: auto; padding: 28px; }

    /* Grid */
    .trips-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 22px;
    }
    @media (max-width: 1100px) { .trips-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 700px)  { .trips-grid { grid-template-columns: 1fr; } }

    /* Trip card */
    .trip-card {
      background: white; border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid #f1f5f9;
      overflow: visible;
      position: relative;
      display: flex; flex-direction: column;
    }
    .trip-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.10);
    }

    /* Thin accent bar */
    .card-accent {
      height: 5px; width: 100%;
      border-radius: 16px 16px 0 0;
    }

    /* Overflow menu — bottom right, visible on hover */
    .card-menu-wrap {
      position: absolute; bottom: 12px; right: 12px;
      opacity: 0; transition: opacity 0.15s;
    }
    .trip-card:hover .card-menu-wrap { opacity: 1; }

    .btn-menu {
      width: 28px; height: 28px;
      background: #f1f5f9;
      border: none; border-radius: 7px; cursor: pointer;
      color: #64748b;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .btn-menu:hover, .btn-menu.open { background: #e2e8f0; color: #0f172a; }

    .card-dropdown {
      position: absolute; bottom: calc(100% + 6px); right: 0;
      background: white; border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
      min-width: 162px; z-index: 50;
      padding: 5px;
      animation: dropIn 120ms ease;
    }
    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .dropdown-item {
      display: flex; align-items: center; gap: 9px;
      width: 100%; padding: 8px 11px;
      background: none; border: none; border-radius: 7px;
      font-size: 0.84rem; font-weight: 500; color: #374151;
      cursor: pointer; text-align: left;
      transition: background 0.12s;
    }
    .dropdown-item:hover { background: #f8fafc; }
    .dropdown-item--danger { color: #dc2626; }
    .dropdown-item--danger:hover { background: #fef2f2; }

    .dropdown-divider {
      height: 1px; background: #f1f5f9; margin: 4px 0;
    }

    /* Card body */
    .card-body { padding: 16px; flex: 1; display: flex; flex-direction: column; }

    .card-title-row {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 10px; margin-bottom: 8px;
    }

    .card-title {
      margin: 0; font-size: 0.97rem; font-weight: 700; color: #0f172a;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      flex: 1; min-width: 0;
    }

    /* Status badge — inline in title row */
    .status-badge {
      flex-shrink: 0;
      font-size: 0.65rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
      padding: 3px 8px; border-radius: 99px;
    }
    .badge--upcoming { background: #eff6ff; color: #2563eb; }
    .badge--active   { background: #f0fdf4; color: #16a34a; }
    .badge--past     { background: #f8fafc; color: #64748b; }

    .card-dates {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; color: #64748b; margin-bottom: 0;
    }
    .card-dates svg { flex-shrink: 0; color: #94a3b8; }

    .card-time-info {
      margin: 5px 0 0;
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .card-description {
      margin: 7px 0 12px;
      font-size: 0.79rem;
      color: #94a3b8;
      line-height: 1.45;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Metadata row — always pinned to bottom */
    .card-meta {
      display: flex; align-items: center; gap: 14px;
      margin-top: auto; padding-top: 12px;
      border-top: 1px solid #f1f5f9;
    }
    .meta-item {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.75rem; color: #94a3b8;
    }
    .meta-item svg { flex-shrink: 0; }

    /* New Trip card */
    .new-trip-card {
      background: white; border-radius: 16px;
      border: 2px dashed #d1d5db; cursor: pointer;
      min-height: 160px;
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.2s, background 0.2s;
    }
    .new-trip-card:hover { border-color: #3b82f6; background: #f0f9ff; }
    .new-trip-card:hover .new-trip-plus { background: #dbeafe; }
    .new-trip-card:hover .new-trip-label { color: #2563eb; }
    .new-trip-inner { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .new-trip-plus {
      width: 48px; height: 48px; border-radius: 50%;
      background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
      transition: background 0.2s;
    }
    .new-trip-label {
      font-size: 0.9rem; font-weight: 600; color: #374151;
      transition: color 0.2s;
    }
    .new-trip-sub { font-size: 0.8rem; color: #94a3b8; }

    /* Skeleton */
    .trip-card--skeleton { cursor: default; pointer-events: none; }
    .skeleton-cover { height: 5px; background: #e2e8f0; animation: shimmer 1.5s ease infinite; }
    .skeleton-body { padding: 16px; }
    .skeleton-line {
      background: #e2e8f0; border-radius: 4px; margin-bottom: 10px;
      animation: shimmer 1.5s ease infinite;
    }
    .skeleton-line--title { height: 16px; width: 70%; }
    .skeleton-line--dates { height: 12px; width: 55%; }
    @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.45} }

    /* Empty state */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 80px 24px; text-align: center;
    }
    .empty-icon {
      width: 72px; height: 72px; border-radius: 20px;
      background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .empty-title { margin: 0 0 8px; font-size: 1.15rem; font-weight: 700; color: #0f172a; }
    .empty-text { margin: 0 0 24px; font-size: 0.9rem; color: #64748b; max-width: 300px; }
    .btn-empty-create {
      display: flex; align-items: center; gap: 8px;
      background: #2563eb; color: white; border: none;
      padding: 10px 22px; border-radius: 10px; cursor: pointer;
      font-size: 0.9rem; font-weight: 600; transition: background 0.15s;
    }
    .btn-empty-create:hover { background: #1d4ed8; }

    /* Filtered empty */
    .filtered-empty {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px 24px; text-align: center;
    }
    .filtered-empty-title { margin: 14px 0 4px; font-size: 1rem; font-weight: 600; color: #0f172a; }
    .filtered-empty-sub { margin: 0 0 16px; font-size: 0.875rem; color: #64748b; }
    .filtered-clear-btn {
      background: none; border: 1px solid #e2e8f0;
      padding: 7px 16px; border-radius: 8px; cursor: pointer;
      font-size: 0.85rem; color: #374151; transition: background 0.15s;
    }
    .filtered-clear-btn:hover { background: #f8fafc; }
  `],
})
export class TripsPageComponent implements OnInit {
  readonly store = inject(TripsStore);
  readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly getStatus = getTripStatus;
  readonly getTimeInfo = getTripTimeInfo;

  readonly showModal = signal(false);
  readonly editingTrip = signal<Trip | null>(null);
  readonly searchQuery = signal('');
  readonly activeFilter = signal<FilterTab>('all');
  readonly openMenuId = signal<string | null>(null);
  readonly skeletons = [1, 2, 3, 4, 5, 6];

  readonly tripsSummary = computed(() => {
    const trips = this.store.trips();
    const active   = trips.filter((t) => getTripStatus(t) === 'active').length;
    const upcoming = trips.filter((t) => getTripStatus(t) === 'upcoming').length;
    const total = trips.length;
    const parts = [`${total} trip${total !== 1 ? 's' : ''}`];
    if (active)   parts.push(`${active} active`);
    if (upcoming) parts.push(`${upcoming} upcoming`);
    return parts.join(' · ');
  });

  readonly tabsWithCounts = computed(() => {
    const trips = this.store.trips();
    return [
      { id: 'all'      as FilterTab, label: 'All',      count: trips.length },
      { id: 'upcoming' as FilterTab, label: 'Upcoming', count: trips.filter((t) => getTripStatus(t) === 'upcoming').length },
      { id: 'active'   as FilterTab, label: 'Active',   count: trips.filter((t) => getTripStatus(t) === 'active').length },
      { id: 'past'     as FilterTab, label: 'Past',     count: trips.filter((t) => getTripStatus(t) === 'past').length },
    ];
  });

  readonly filteredTrips = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const filter = this.activeFilter();
    let list = this.store.trips();

    if (filter !== 'all') {
      list = list.filter((t) => getTripStatus(t) === filter);
    }
    if (q) {
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    return list;
  });

  ngOnInit(): void {
    this.store.loadTrips();
  }

  onTripClick(tripId: string): void {
    this.router.navigate(['/trips', tripId, 'overview']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.activeFilter.set('all');
  }

  toggleMenu(id: string): void {
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  closeMenu(): void {
    this.openMenuId.set(null);
  }

  readonly getTripColor = getTripColor;
}
