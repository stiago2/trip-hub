import { DatePipe } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlightLocation, FlightOffer, FlightSearchApiService, TransportApiService, TripStore } from '@org/data-access-trips';
import { debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-flight-search-modal',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="overlay" (click)="closed.emit()">
      <div class="modal" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-header">
          <div class="modal-title-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2A1 1 0 0 0 4 6l4 4-2 2-4-1-1 1 3 2 2 3 1-1-1-4 2-2 4 4a1 1 0 0 0 .8-.2z"/>
            </svg>
            <span>Search Flights</span>
          </div>
          <button class="close-btn" (click)="closed.emit()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Trip type toggle -->
        <div class="trip-type-bar">
          <button class="trip-type-btn" [class.active]="tripType === 'one-way'" (click)="tripType = 'one-way'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            One way
          </button>
          <button class="trip-type-btn" [class.active]="tripType === 'round-trip'" (click)="tripType = 'round-trip'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            Round trip
          </button>
        </div>

        <!-- Search Form -->
        <div class="search-form">

          <!-- Row 1: From / To -->
          <div class="form-row">
            <div class="field-wrap field-wrap--lg">
              <label class="field-label">From</label>
              <div class="location-input-wrap">
                <svg class="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                <input
                  class="field-input field-input--icon"
                  placeholder="City or airport"
                  [(ngModel)]="fromQuery"
                  (ngModelChange)="onFromQueryChange($event)"
                  [value]="fromSelected() ? fromSelected()!.code + ' – ' + fromSelected()!.cityName : fromQuery"
                  (focus)="fromDropdownOpen.set(true)"
                  (blur)="fromDropdownOpen.set(false)"
                />
                @if (fromDropdownOpen() && fromLocations().length > 0) {
                  <ul class="dropdown">
                    @for (loc of fromLocations(); track loc.id) {
                      <li class="dropdown-item" (mousedown)="selectFrom(loc)">
                        <span class="loc-code">{{ loc.code }}</span>
                        <div class="loc-info">
                          <span class="loc-city">{{ loc.cityName }}</span>
                          <span class="loc-country">{{ loc.countryName }}</span>
                        </div>
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>

            <div class="swap-btn-wrap">
              <button class="swap-btn" (click)="swapLocations()" title="Swap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              </button>
            </div>

            <div class="field-wrap field-wrap--lg">
              <label class="field-label">To</label>
              <div class="location-input-wrap">
                <svg class="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                <input
                  class="field-input field-input--icon"
                  placeholder="City or airport"
                  [(ngModel)]="toQuery"
                  (ngModelChange)="onToQueryChange($event)"
                  [value]="toSelected() ? toSelected()!.code + ' – ' + toSelected()!.cityName : toQuery"
                  (focus)="toDropdownOpen.set(true)"
                  (blur)="toDropdownOpen.set(false)"
                />
                @if (toDropdownOpen() && toLocations().length > 0) {
                  <ul class="dropdown">
                    @for (loc of toLocations(); track loc.id) {
                      <li class="dropdown-item" (mousedown)="selectTo(loc)">
                        <span class="loc-code">{{ loc.code }}</span>
                        <div class="loc-info">
                          <span class="loc-city">{{ loc.cityName }}</span>
                          <span class="loc-country">{{ loc.countryName }}</span>
                        </div>
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
          </div>

          <!-- Row 2: Dates / Adults / Cabin / Search -->
          <div class="form-row form-row--bottom">
            <div class="field-wrap">
              <label class="field-label">Departure</label>
              <input class="field-input" type="date" [(ngModel)]="departDate" />
            </div>

            @if (tripType === 'round-trip') {
              <div class="field-wrap">
                <label class="field-label">Return</label>
                <input class="field-input" type="date" [(ngModel)]="returnDate" [min]="departDate" />
              </div>
            }

            <div class="field-wrap field-wrap--sm">
              <label class="field-label">Adults</label>
              <input class="field-input" type="number" min="1" max="9" [(ngModel)]="adults" />
            </div>

            <div class="field-wrap field-wrap--md">
              <label class="field-label">Cabin</label>
              <select class="field-input" [(ngModel)]="cabinClass">
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Prem. Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First</option>
              </select>
            </div>

            <button class="btn-search" (click)="search()" [disabled]="searching() || !fromSelected() || !toSelected()">
              @if (searching()) {
                <span class="spinner"></span>
              } @else {
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              }
              Search
            </button>
          </div>
        </div>

        <!-- Results -->
        @if (results().length > 0) {
          <div class="results">
            <p class="results-count">{{ results().length }} flights found</p>
            <div class="flight-list">
              @for (flight of results(); track flight.token) {
                <div class="flight-card">
                  <div class="flight-route">
                    <div class="route-point">
                      <span class="route-code">{{ flight.fromCode }}</span>
                      <span class="route-city">{{ flight.fromCity }}</span>
                      <span class="route-time">{{ flight.departureTime | date:'HH:mm' }}</span>
                    </div>
                    <div class="route-middle">
                      <span class="route-duration">{{ formatDuration(flight.durationMinutes) }}</span>
                      <div class="route-line">
                        <div class="line-dot"></div>
                        <div class="line-bar"></div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#6366f1"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2A1 1 0 0 0 4 6l4 4-2 2-4-1-1 1 3 2 2 3 1-1-1-4 2-2 4 4a1 1 0 0 0 .8-.2z"/></svg>
                        <div class="line-bar"></div>
                        <div class="line-dot"></div>
                      </div>
                      <span class="route-stops" [class.nonstop]="flight.stops === 0">
                        {{ flight.stops === 0 ? 'Non-stop' : flight.stops + ' stop' + (flight.stops > 1 ? 's' : '') }}
                      </span>
                    </div>
                    <div class="route-point route-point--right">
                      <span class="route-code">{{ flight.toCode }}</span>
                      <span class="route-city">{{ flight.toCity }}</span>
                      <span class="route-time">{{ flight.arrivalTime | date:'HH:mm' }}</span>
                    </div>
                  </div>

                  <div class="flight-footer">
                    <div class="flight-tags">
                      <span class="tag-airline">{{ flight.airline }}</span>
                      <span class="tag-cabin">{{ flight.cabinClass }}</span>
                    </div>
                    <div class="flight-price-row">
                      <span class="flight-price">{{ flight.currency }} {{ flight.price }}</span>
                      <div class="btn-group">
                        <a class="btn-book" [href]="getBookingComUrl(flight)" target="_blank" rel="noopener" title="Book this specific flight on Booking.com">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          Book
                        </a>
                        <a class="btn-airline" [href]="getAirlineUrl(flight)" target="_blank" rel="noopener" [title]="'Search on ' + flight.airline">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2A1 1 0 0 0 4 6l4 4-2 2-4-1-1 1 3 2 2 3 1-1-1-4 2-2 4 4a1 1 0 0 0 .8-.2z"/></svg>
                          {{ flight.airline }}
                        </a>
                        <button class="btn-add" (click)="addToTrip(flight)">+ Add to trip</button>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        @if (searched() && results().length === 0 && !searching() && !searchError()) {
          <div class="body-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <p class="state-title">No flights found</p>
            <p class="state-sub">Try different dates or airports.</p>
          </div>
        }

        @if (searchError()) {
          <div class="body-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p class="state-title" style="color:#ef4444">Search failed</p>
            <p class="state-sub" style="color:#f87171">{{ searchError() }}</p>
          </div>
        }

        @if (!searched() && !searching()) {
          <div class="body-state body-state--hint">
            <div class="hint-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="1.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2A1 1 0 0 0 4 6l4 4-2 2-4-1-1 1 3 2 2 3 1-1-1-4 2-2 4 4a1 1 0 0 0 .8-.2z"/></svg>
            </div>
            <p class="state-title">Ready to take off?</p>
            <p class="state-sub">Select origin and destination, then click Search.</p>
          </div>
        }

        @if (searching()) {
          <div class="body-state">
            <div class="big-spinner"></div>
            <p class="state-sub">Searching flights...</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(15,23,42,0.55); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .modal {
      background: white; border-radius: 20px;
      width: 100%; max-width: 780px;
      min-height: 460px; max-height: 90vh;
      display: flex; flex-direction: column;
      box-shadow: 0 24px 80px rgba(0,0,0,0.18);
      overflow: visible;
    }

    /* Header */
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 22px 28px 18px; flex-shrink: 0;
    }
    .modal-title-row {
      display: flex; align-items: center; gap: 10px;
      font-size: 1.1rem; font-weight: 700; color: #0f172a;
    }
    .close-btn {
      background: #f8fafc; border: 1px solid #e2e8f0; cursor: pointer; color: #94a3b8;
      width: 32px; height: 32px; border-radius: 8px; display: flex;
      align-items: center; justify-content: center; transition: all 0.15s;
    }
    .close-btn:hover { background: #f1f5f9; color: #475569; }

    /* Trip type toggle */
    .trip-type-bar {
      display: flex; gap: 6px; padding: 0 28px 18px; flex-shrink: 0;
    }
    .trip-type-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 20px; border: 1.5px solid #e2e8f0;
      background: white; font-size: 0.8rem; font-weight: 600; color: #64748b;
      cursor: pointer; transition: all 0.15s;
    }
    .trip-type-btn.active {
      background: #eef2ff; border-color: #c7d2fe; color: #6366f1;
    }
    .trip-type-btn:hover:not(.active) { border-color: #cbd5e1; color: #475569; }

    /* Form */
    .search-form {
      padding: 0 28px 24px; flex-shrink: 0;
      display: flex; flex-direction: column; gap: 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .form-row {
      display: flex; align-items: flex-end; gap: 12px;
    }
    .form-row--bottom { flex-wrap: wrap; }

    .field-wrap { display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .field-wrap--lg { flex: 2; }
    .field-wrap--md { flex: 0 0 130px; }
    .field-wrap--sm { flex: 0 0 80px; }

    .field-label {
      font-size: 0.7rem; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .field-input {
      padding: 11px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 0.9rem; color: #1e293b; outline: none; background: #fafafa;
      transition: border-color 0.15s, background 0.15s; width: 100%; box-sizing: border-box;
    }
    .field-input:focus { border-color: #6366f1; background: white; }
    .field-input--icon { padding-left: 36px; }
    select.field-input { cursor: pointer; }

    /* Location input */
    .location-input-wrap { position: relative; }
    .field-icon {
      position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
      pointer-events: none;
    }
    .dropdown {
      position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 20;
      background: white; border: 1.5px solid #e2e8f0; border-radius: 12px;
      list-style: none; margin: 0; padding: 6px 0;
      box-shadow: 0 12px 32px rgba(0,0,0,0.1); max-height: 220px; overflow-y: auto;
    }
    .dropdown-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; cursor: pointer; transition: background 0.1s;
    }
    .dropdown-item:hover { background: #f8fafc; }
    .loc-code {
      font-size: 0.85rem; font-weight: 800; color: #6366f1;
      min-width: 38px; background: #eef2ff; padding: 3px 6px;
      border-radius: 6px; text-align: center;
    }
    .loc-info { display: flex; flex-direction: column; gap: 1px; }
    .loc-city { font-size: 0.85rem; font-weight: 600; color: #1e293b; }
    .loc-country { font-size: 0.75rem; color: #94a3b8; }

    /* Swap button */
    .swap-btn-wrap { flex: 0 0 auto; padding-bottom: 2px; }
    .swap-btn {
      width: 36px; height: 40px; background: #f8fafc; border: 1.5px solid #e2e8f0;
      border-radius: 10px; cursor: pointer; color: #64748b;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .swap-btn:hover { border-color: #6366f1; color: #6366f1; background: #eef2ff; }

    /* Search button */
    .btn-search {
      display: flex; align-items: center; gap: 8px;
      padding: 11px 24px; background: #6366f1; color: white;
      border: none; border-radius: 10px; cursor: pointer;
      font-size: 0.9rem; font-weight: 600;
      transition: background 0.15s; flex-shrink: 0; white-space: nowrap;
    }
    .btn-search:hover:not(:disabled) { background: #4f46e5; }
    .btn-search:disabled { opacity: 0.55; cursor: not-allowed; }
    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.35);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Results */
    .results { flex: 1; overflow-y: auto; padding: 20px 28px; border-radius: 0 0 20px 20px; }
    .results-count { margin: 0 0 14px; font-size: 0.82rem; color: #94a3b8; font-weight: 500; }

    .flight-list { display: flex; flex-direction: column; gap: 12px; }
    .flight-card {
      border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 18px 20px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .flight-card:hover { border-color: #c7d2fe; box-shadow: 0 4px 16px rgba(99,102,241,0.08); }

    .flight-route {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 14px;
    }
    .route-point { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; }
    .route-point--right { align-items: flex-end; }
    .route-code { font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .route-city { font-size: 0.75rem; color: #94a3b8; }
    .route-time { font-size: 0.9rem; font-weight: 600; color: #334155; margin-top: 2px; }

    .route-middle {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 0 20px;
    }
    .route-duration { font-size: 0.75rem; color: #64748b; font-weight: 500; }
    .route-line {
      display: flex; align-items: center; gap: 4px; width: 100%;
    }
    .line-dot { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; flex-shrink: 0; }
    .line-bar { flex: 1; height: 1.5px; background: #c7d2fe; }
    .route-stops { font-size: 0.7rem; color: #94a3b8; }
    .route-stops.nonstop { color: #10b981; font-weight: 600; }

    .flight-footer {
      display: flex; justify-content: space-between; align-items: center;
      border-top: 1px solid #f1f5f9; padding-top: 12px;
    }
    .flight-tags { display: flex; gap: 6px; align-items: center; }
    .tag-airline { font-size: 0.8rem; color: #475569; font-weight: 500; }
    .tag-cabin {
      font-size: 0.68rem; font-weight: 700; color: #6366f1;
      background: #eef2ff; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.02em;
    }
    .flight-price-row { display: flex; align-items: center; gap: 14px; }
    .flight-price { font-size: 1.2rem; font-weight: 800; color: #0f172a; }
    .btn-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .btn-book {
      display: flex; align-items: center; gap: 5px;
      padding: 8px 14px; background: #eef2ff; color: #6366f1;
      border: 1.5px solid #c7d2fe; border-radius: 8px;
      font-size: 0.82rem; font-weight: 600; text-decoration: none;
      transition: all 0.15s; white-space: nowrap;
    }
    .btn-book:hover { background: #e0e7ff; border-color: #a5b4fc; }
    .btn-airline {
      display: flex; align-items: center; gap: 5px;
      padding: 8px 12px; background: #f8fafc; color: #475569;
      border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.78rem; font-weight: 600; text-decoration: none;
      transition: all 0.15s; white-space: nowrap; max-width: 120px;
      overflow: hidden; text-overflow: ellipsis;
    }
    .btn-airline:hover { background: #f1f5f9; border-color: #cbd5e1; color: #1e293b; }
    .btn-add {
      padding: 8px 16px; background: #f0fdf4; color: #16a34a;
      border: 1.5px solid #bbf7d0; border-radius: 8px; cursor: pointer;
      font-size: 0.82rem; font-weight: 600; transition: all 0.15s; white-space: nowrap;
    }
    .btn-add:hover { background: #dcfce7; border-color: #86efac; }

    .body-state {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 10px; padding: 32px 24px; text-align: center;
    }
    .body-state--hint { background: #fafbff; border-radius: 0 0 20px 20px; }
    .hint-icon {
      width: 64px; height: 64px; background: #eef2ff; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
    }
    .state-title { margin: 0; font-size: 1rem; font-weight: 700; color: #1e293b; }
    .state-sub { margin: 0; font-size: 0.85rem; color: #94a3b8; }
    .big-spinner {
      width: 36px; height: 36px; border: 3px solid #e0e7ff;
      border-top-color: #6366f1; border-radius: 50%;
      animation: spin 0.8s linear infinite; margin-bottom: 6px;
    }
  `],
})
export class FlightSearchModalComponent implements OnInit {
  private readonly api = inject(FlightSearchApiService);
  private readonly transportApi = inject(TransportApiService);
  private readonly tripStore = inject(TripStore);

  readonly tripId = input('');
  readonly closed = output<void>();

  tripType: 'one-way' | 'round-trip' = 'one-way';
  fromQuery = '';
  toQuery = '';
  departDate = '';
  returnDate = '';
  adults = 1;
  cabinClass = 'ECONOMY';

  readonly fromSelected = signal<FlightLocation | null>(null);
  readonly toSelected = signal<FlightLocation | null>(null);
  readonly fromLocations = signal<FlightLocation[]>([]);
  readonly toLocations = signal<FlightLocation[]>([]);
  readonly fromDropdownOpen = signal(false);
  readonly toDropdownOpen = signal(false);
  readonly results = signal<FlightOffer[]>([]);
  readonly searching = signal(false);
  readonly searched = signal(false);
  readonly searchError = signal<string | null>(null);

  private readonly fromSearch$ = new Subject<string>();
  private readonly toSearch$ = new Subject<string>();

  ngOnInit(): void {
    const today = new Date().toISOString().substring(0, 10);
    const trip = this.tripStore.trip();
    if (trip?.startDate) {
      const tripStart = trip.startDate.substring(0, 10);
      this.departDate = tripStart > today ? tripStart : today;
    } else {
      this.departDate = today;
    }
    if (trip?.endDate) {
      const tripEnd = trip.endDate.substring(0, 10);
      this.returnDate = tripEnd > today ? tripEnd : today;
    }

    this.fromSearch$.pipe(
      debounceTime(350), distinctUntilChanged(),
      switchMap(q => q.length >= 2 ? this.api.searchLocations(q) : of([])),
    ).subscribe(locs => this.fromLocations.set(locs));

    this.toSearch$.pipe(
      debounceTime(350), distinctUntilChanged(),
      switchMap(q => q.length >= 2 ? this.api.searchLocations(q) : of([])),
    ).subscribe(locs => this.toLocations.set(locs));
  }

  onFromQueryChange(q: string): void { this.fromSelected.set(null); this.fromSearch$.next(q); }
  onToQueryChange(q: string): void { this.toSelected.set(null); this.toSearch$.next(q); }

  selectFrom(loc: FlightLocation): void {
    this.fromSelected.set(loc);
    this.fromQuery = `${loc.code} – ${loc.cityName}`;
    this.fromDropdownOpen.set(false);
  }

  selectTo(loc: FlightLocation): void {
    this.toSelected.set(loc);
    this.toQuery = `${loc.code} – ${loc.cityName}`;
    this.toDropdownOpen.set(false);
  }

  swapLocations(): void {
    const from = this.fromSelected();
    const to = this.toSelected();
    const fromQ = this.fromQuery;
    const toQ = this.toQuery;
    this.fromSelected.set(to); this.fromQuery = toQ;
    this.toSelected.set(from); this.toQuery = fromQ;
  }

  search(): void {
    const from = this.fromSelected();
    const to = this.toSelected();
    if (!from || !to || !this.departDate) return;
    this.searching.set(true);
    this.searchError.set(null);
    this.api.searchFlights({
      fromId: from.id, toId: to.id,
      departDate: this.departDate,
      adults: this.adults,
      cabinClass: this.cabinClass,
    }).subscribe({
      next: (offers) => { this.results.set(offers); this.searched.set(true); this.searching.set(false); },
      error: (err) => {
        console.error('Flight search error:', err);
        this.searchError.set(err?.error?.message ?? err?.message ?? 'Error searching flights. Check the console for details.');
        this.searching.set(false);
      },
    });
  }

  addToTrip(flight: FlightOffer): void {
    const id = this.tripId() || this.tripStore.activeTripId() || '';
    if (!id) return;
    this.transportApi.createTransport(id, {
      type: 'FLIGHT',
      fromLocation: `${flight.fromCode} – ${flight.fromCity}`,
      toLocation: `${flight.toCode} – ${flight.toCity}`,
      departureTime: flight.departureTime || new Date().toISOString(),
      arrivalTime: flight.arrivalTime || new Date().toISOString(),
      price: flight.price,
    }).subscribe(() => this.closed.emit());
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  getAirlineUrl(flight: FlightOffer): string {
    const from = flight.fromCode;
    const to = flight.toCode;
    const depart = this.departDate;
    const adults = this.adults;
    const isRound = this.tripType === 'round-trip';
    const ret = this.returnDate;

    const airlineUrls: Record<string, () => string> = {
      AV: () => { const p = new URLSearchParams({ origin: from, destination: to, departDate: depart, adults: String(adults), cabin: 'Y', tripType: isRound ? 'RT' : 'OW', ...(isRound && ret ? { returnDate: ret } : {}) }); return `https://www.avianca.com/co/es/vuelos/?${p}`; },
      LA: () => { const p = new URLSearchParams({ ori: from, des: to, fecha_ida: depart, adultos: String(adults), ...(isRound && ret ? { fecha_vuelta: ret } : {}) }); return `https://www.latam.com/es_co/vuelos/?${p}`; },
      CM: () => { const p = new URLSearchParams({ origin: from, destination: to, departureDate: depart, adults: String(adults), cabin: 'Y', tripType: isRound ? 'RT' : 'OW' }); return `https://www.copaair.com/es-co/vuelos/?${p}`; },
      AA: () => { const p = new URLSearchParams({ origin: from, destination: to, departureDate: depart, adults: String(adults), tripType: isRound ? 'roundTrip' : 'oneWay', ...(isRound && ret ? { returnDate: ret } : {}) }); return `https://www.aa.com/booking/find-flights/${isRound ? 'roundtrip' : 'oneway'}?${p}`; },
      DL: () => { const p = new URLSearchParams({ tripType: isRound ? 'R' : 'O', fromCity: from, toCity: to, departDate: depart, paxCount: String(adults), cabinType: 'coach' }); return `https://www.delta.com/flight-search/book-a-flight#/results?${p}`; },
      UA: () => { const p = new URLSearchParams({ f: from, t: to, d: depart, tt: isRound ? '2' : '1', px: String(adults) }); return `https://www.united.com/en/us/fsr/choose-flights?${p}`; },
      B6: () => { const p = new URLSearchParams({ from, to, depart, isMultiCity: 'false', adults: String(adults) }); return `https://www.jetblue.com/booking/flights?${p}`; },
      NK: () => `https://www.spirit.com/book`,
      P5: () => `https://www.wingo.com/es-co/`,
      XH: () => `https://jetsmart.com/co/es/`,
      JA: () => `https://jetsmart.com/co/es/`,
    };

    const buildFn = airlineUrls[flight.airlineCode];
    if (buildFn) return buildFn();
    return `https://www.google.com/travel/flights/search?q=flights+from+${from}+to+${to}+on+${depart}`;
  }

  getBookingComUrl(flight: FlightOffer): string {
    // Pass the flight token so Booking.com loads that specific flight directly
    const from = this.fromSelected();
    const to = this.toSelected();
    const params = new URLSearchParams({
      type: this.tripType === 'round-trip' ? 'ROUNDTRIP' : 'ONEWAY',
      adults: String(this.adults),
      cabinClass: this.cabinClass,
      from: from?.id ?? flight.fromCode,
      to: to?.id ?? flight.toCode,
      depart: this.departDate,
      token: flight.token,
      ...(this.tripType === 'round-trip' && this.returnDate ? { return: this.returnDate } : {}),
    });
    return `https://flights.booking.com/flights/${from?.id ?? flight.fromCode}-${to?.id ?? flight.toCode}/?${params.toString()}`;
  }
}
