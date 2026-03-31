import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonSpinner,
  IonIcon, ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { swapHorizontalOutline, searchOutline, airplaneOutline, addCircleOutline, openOutline } from 'ionicons/icons';
import { debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { FlightLocation, FlightOffer, FlightSearchApiService, TransportApiService, TripStore } from '@org/data-access-trips';

@Component({
  selector: 'app-flight-search-modal',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonSpinner,
    IonIcon,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">Close</ion-button>
        </ion-buttons>
        <ion-title>Search Flights</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Search form -->
      <div class="form-wrap">

        <!-- From / To -->
        <div class="location-row">
          <div class="loc-field">
            <div class="loc-label">From</div>
            <input
              class="loc-input"
              placeholder="City or airport"
              [(ngModel)]="fromQuery"
              (ngModelChange)="onFromChange($event)"
              (focus)="fromOpen.set(true)"
              (blur)="closeFrom()"
            />
            @if (fromOpen() && fromResults().length > 0) {
              <ul class="dropdown">
                @for (loc of fromResults(); track loc.id) {
                  <li class="drop-item" (mousedown)="selectFrom(loc)">
                    <span class="loc-code">{{ loc.code }}</span>
                    <div>
                      <div class="loc-city">{{ loc.cityName }}</div>
                      <div class="loc-country">{{ loc.countryName }}</div>
                    </div>
                  </li>
                }
              </ul>
            }
          </div>

          <button class="swap-btn" (click)="swapLocations()">
            <ion-icon name="swap-horizontal-outline"></ion-icon>
          </button>

          <div class="loc-field">
            <div class="loc-label">To</div>
            <input
              class="loc-input"
              placeholder="City or airport"
              [(ngModel)]="toQuery"
              (ngModelChange)="onToChange($event)"
              (focus)="toOpen.set(true)"
              (blur)="closeTo()"
            />
            @if (toOpen() && toResults().length > 0) {
              <ul class="dropdown">
                @for (loc of toResults(); track loc.id) {
                  <li class="drop-item" (mousedown)="selectTo(loc)">
                    <span class="loc-code">{{ loc.code }}</span>
                    <div>
                      <div class="loc-city">{{ loc.cityName }}</div>
                      <div class="loc-country">{{ loc.countryName }}</div>
                    </div>
                  </li>
                }
              </ul>
            }
          </div>
        </div>

        <!-- Date / Options -->
        <div class="options-row">
          <div class="opt-field">
            <div class="opt-label">Depart</div>
            <input class="opt-input" type="date" [(ngModel)]="departDate" />
          </div>
          <div class="opt-field opt-field--sm">
            <div class="opt-label">Adults</div>
            <input class="opt-input" type="number" min="1" max="9" [(ngModel)]="adults" />
          </div>
          <div class="opt-field">
            <div class="opt-label">Cabin</div>
            <select class="opt-input" [(ngModel)]="cabinClass">
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM_ECONOMY">Prem. Eco</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First</option>
            </select>
          </div>
        </div>

        <button
          class="search-btn"
          (click)="search()"
          [disabled]="!fromSel() || !toSel() || searching()"
        >
          @if (searching()) {
            <ion-spinner name="crescent" style="width:18px;height:18px;color:#fff"></ion-spinner>
          } @else {
            <ion-icon name="search-outline"></ion-icon>
          }
          Search Flights
        </button>
      </div>

      <!-- States -->
      @if (!searched() && !searching()) {
        <div class="state-wrap">
          <div class="state-icon"><ion-icon name="airplane-outline"></ion-icon></div>
          <div class="state-title">Find your next flight</div>
          <div class="state-sub">Select airports above then tap Search</div>
        </div>
      }

      @if (searching()) {
        <div class="state-wrap">
          <ion-spinner name="crescent" style="width:48px;height:48px;color:#2563eb"></ion-spinner>
          <div class="state-sub" style="margin-top:12px">Searching…</div>
        </div>
      }

      @if (searchError()) {
        <div class="state-wrap">
          <div class="state-title" style="color:#ef4444">Search failed</div>
          <div class="state-sub">{{ searchError() }}</div>
        </div>
      }

      @if (searched() && !searching() && results().length === 0 && !searchError()) {
        <div class="state-wrap">
          <div class="state-title">No flights found</div>
          <div class="state-sub">Try different dates or airports</div>
        </div>
      }

      <!-- Results list -->
      @if (results().length > 0) {
        <div class="results-wrap">
          <div class="results-count">{{ results().length }} flights found</div>
          @for (flight of results(); track flight.token) {
            <div class="flight-card">

              <!-- Route -->
              <div class="route-row">
                <div class="route-pt">
                  <div class="pt-code">{{ flight.fromCode }}</div>
                  <div class="pt-city">{{ flight.fromCity }}</div>
                  <div class="pt-time">{{ flight.departureTime | date:'HH:mm' }}</div>
                </div>
                <div class="route-mid">
                  <div class="mid-dur">{{ formatDuration(flight.durationMinutes) }}</div>
                  <div class="mid-line">
                    <div class="line-dot"></div>
                    <div class="line-bar"></div>
                    <ion-icon name="airplane-outline" style="color:#2563eb;font-size:14px"></ion-icon>
                    <div class="line-bar"></div>
                    <div class="line-dot"></div>
                  </div>
                  <div class="mid-stops" [class.nonstop]="flight.stops === 0">
                    {{ flight.stops === 0 ? 'Non-stop' : flight.stops + ' stop' + (flight.stops > 1 ? 's' : '') }}
                  </div>
                </div>
                <div class="route-pt route-pt--right">
                  <div class="pt-code">{{ flight.toCode }}</div>
                  <div class="pt-city">{{ flight.toCity }}</div>
                  <div class="pt-time">{{ flight.arrivalTime | date:'HH:mm' }}</div>
                </div>
              </div>

              <!-- Footer -->
              <div class="card-footer">
                <div class="footer-left">
                  <div class="airline-name">{{ flight.airline }}</div>
                  <div class="cabin-tag">{{ flight.cabinClass }}</div>
                </div>
                <div class="price-actions">
                  <div class="price">{{ flight.currency }} {{ flight.price }}</div>
                  <div class="actions">
                    <a class="btn-book" [href]="getBookingUrl(flight)" target="_blank" rel="noopener">
                      <ion-icon name="open-outline"></ion-icon> Book
                    </a>
                    <button class="btn-add" (click)="addToTrip(flight)" [disabled]="addingId() === flight.token">
                      @if (addingId() === flight.token) {
                        <ion-spinner name="crescent" style="width:14px;height:14px"></ion-spinner>
                      } @else {
                        <ion-icon name="add-circle-outline"></ion-icon> Add
                      }
                    </button>
                  </div>
                </div>
              </div>

            </div>
          }
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .form-wrap {
      padding: 16px; display: flex; flex-direction: column; gap: 12px;
      border-bottom: 1px solid #f1f5f9;
    }

    .location-row {
      display: flex; align-items: flex-end; gap: 8px;
    }
    .loc-field { flex: 1; position: relative; }
    .loc-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
    .loc-input {
      width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 0.9rem; color: #0f172a; outline: none; background: #fafafa; box-sizing: border-box;
    }
    .loc-input:focus { border-color: #2563eb; background: #fff; }

    .swap-btn {
      flex-shrink: 0; width: 36px; height: 40px; background: #f1f5f9;
      border: none; border-radius: 10px; cursor: pointer; color: #64748b;
      display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
      margin-bottom: 0;
    }

    .dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 100;
      background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px;
      list-style: none; margin: 0; padding: 6px 0;
      box-shadow: 0 12px 32px rgba(0,0,0,0.12); max-height: 200px; overflow-y: auto;
    }
    .drop-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer;
    }
    .drop-item:active { background: #f8fafc; }
    .loc-code {
      font-size: 0.78rem; font-weight: 800; color: #2563eb;
      background: #eff6ff; padding: 2px 6px; border-radius: 6px; flex-shrink: 0;
    }
    .loc-city { font-size: 0.85rem; font-weight: 600; color: #0f172a; }
    .loc-country { font-size: 0.72rem; color: #94a3b8; }

    .options-row { display: flex; gap: 8px; }
    .opt-field { flex: 1; }
    .opt-field--sm { flex: 0 0 60px; }
    .opt-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
    .opt-input {
      width: 100%; padding: 10px 8px; border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 0.82rem; color: #0f172a; outline: none; background: #fafafa; box-sizing: border-box;
    }
    .opt-input:focus { border-color: #2563eb; }

    .search-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 13px; background: #2563eb; color: white; border: none; border-radius: 12px;
      font-size: 0.95rem; font-weight: 600; cursor: pointer; width: 100%;
    }
    .search-btn:disabled { opacity: 0.6; }

    /* States */
    .state-wrap {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 60px 32px; gap: 10px; text-align: center;
    }
    .state-icon {
      width: 64px; height: 64px; background: #eff6ff; border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; color: #2563eb; margin-bottom: 4px;
    }
    .state-title { font-size: 1rem; font-weight: 700; color: #0f172a; }
    .state-sub { font-size: 0.85rem; color: #94a3b8; }

    /* Results */
    .results-wrap { padding: 16px 16px 40px; }
    .results-count { font-size: 0.78rem; color: #94a3b8; font-weight: 500; margin-bottom: 12px; }

    .flight-card {
      background: #fff; border-radius: 16px; padding: 16px;
      margin-bottom: 12px; box-shadow: 0 2px 12px rgba(15,23,42,0.07);
    }

    .route-row { display: flex; align-items: center; margin-bottom: 12px; }
    .route-pt { display: flex; flex-direction: column; gap: 2px; }
    .route-pt--right { align-items: flex-end; }
    .pt-code { font-size: 1.4rem; font-weight: 800; color: #0f172a; }
    .pt-city { font-size: 0.7rem; color: #94a3b8; }
    .pt-time { font-size: 0.85rem; font-weight: 600; color: #475569; margin-top: 2px; }

    .route-mid { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 0 12px; }
    .mid-dur { font-size: 0.7rem; color: #64748b; }
    .mid-line { display: flex; align-items: center; gap: 3px; width: 100%; }
    .line-dot { width: 5px; height: 5px; background: #2563eb; border-radius: 50%; flex-shrink: 0; }
    .line-bar { flex: 1; height: 1.5px; background: #bfdbfe; }
    .mid-stops { font-size: 0.68rem; color: #94a3b8; }
    .mid-stops.nonstop { color: #16a34a; font-weight: 600; }

    .card-footer { border-top: 1px solid #f1f5f9; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-left { display: flex; flex-direction: column; gap: 4px; }
    .airline-name { font-size: 0.82rem; font-weight: 600; color: #475569; }
    .cabin-tag { font-size: 0.68rem; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 2px 7px; border-radius: 20px; width: fit-content; }

    .price-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .price { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
    .actions { display: flex; gap: 8px; }

    .btn-book {
      display: flex; align-items: center; gap: 4px; padding: 7px 12px;
      background: #eff6ff; color: #2563eb; border: 1.5px solid #bfdbfe;
      border-radius: 8px; font-size: 0.78rem; font-weight: 600; text-decoration: none;
    }
    .btn-add {
      display: flex; align-items: center; gap: 4px; padding: 7px 12px;
      background: #f0fdf4; color: #16a34a; border: 1.5px solid #bbf7d0;
      border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer;
    }
    .btn-add:disabled { opacity: 0.6; }
  `],
})
export class FlightSearchModalComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly api = inject(FlightSearchApiService);
  private readonly transportApi = inject(TransportApiService);
  private readonly tripStore = inject(TripStore);

  fromQuery = '';
  toQuery = '';
  departDate = '';
  adults = 1;
  cabinClass = 'ECONOMY';

  readonly fromSel = signal<FlightLocation | null>(null);
  readonly toSel = signal<FlightLocation | null>(null);
  readonly fromResults = signal<FlightLocation[]>([]);
  readonly toResults = signal<FlightLocation[]>([]);
  readonly fromOpen = signal(false);
  readonly toOpen = signal(false);
  readonly results = signal<FlightOffer[]>([]);
  readonly searching = signal(false);
  readonly searched = signal(false);
  readonly searchError = signal<string | null>(null);
  readonly addingId = signal<string | null>(null);

  private readonly from$ = new Subject<string>();
  private readonly to$ = new Subject<string>();

  ngOnInit(): void {
    const today = new Date().toISOString().slice(0, 10);
    const trip = this.tripStore.trip();
    const tripStart = trip?.startDate?.slice(0, 10);
    this.departDate = tripStart && tripStart > today ? tripStart : today;

    this.from$.pipe(
      debounceTime(350), distinctUntilChanged(),
      switchMap((q) => q.length >= 2 ? this.api.searchLocations(q) : of([])),
    ).subscribe((locs) => this.fromResults.set(locs));

    this.to$.pipe(
      debounceTime(350), distinctUntilChanged(),
      switchMap((q) => q.length >= 2 ? this.api.searchLocations(q) : of([])),
    ).subscribe((locs) => this.toResults.set(locs));

    addIcons({ swapHorizontalOutline, searchOutline, airplaneOutline, addCircleOutline, openOutline });
  }

  onFromChange(q: string): void { this.fromSel.set(null); this.from$.next(q); }
  onToChange(q: string): void { this.toSel.set(null); this.to$.next(q); }

  selectFrom(loc: FlightLocation): void {
    this.fromSel.set(loc);
    this.fromQuery = `${loc.code} – ${loc.cityName}`;
    this.fromOpen.set(false);
  }

  selectTo(loc: FlightLocation): void {
    this.toSel.set(loc);
    this.toQuery = `${loc.code} – ${loc.cityName}`;
    this.toOpen.set(false);
  }

  closeFrom(): void { setTimeout(() => this.fromOpen.set(false), 200); }
  closeTo(): void { setTimeout(() => this.toOpen.set(false), 200); }

  swapLocations(): void {
    const f = this.fromSel(); const t = this.toSel();
    const fq = this.fromQuery; const tq = this.toQuery;
    this.fromSel.set(t); this.fromQuery = tq;
    this.toSel.set(f); this.toQuery = fq;
  }

  search(): void {
    const from = this.fromSel(); const to = this.toSel();
    if (!from || !to) return;
    this.searching.set(true);
    this.searchError.set(null);
    this.searched.set(false);
    this.api.searchFlights({ fromId: from.id, toId: to.id, departDate: this.departDate, adults: this.adults, cabinClass: this.cabinClass }).subscribe({
      next: (offers) => { this.results.set(offers); this.searched.set(true); this.searching.set(false); },
      error: (err) => {
        this.searchError.set(err?.error?.message ?? 'Search failed. Try again.');
        this.searching.set(false);
      },
    });
  }

  addToTrip(flight: FlightOffer): void {
    const id = this.tripStore.activeTripId();
    if (!id) return;
    this.addingId.set(flight.token);
    this.transportApi.createTransport(id, {
      type: 'FLIGHT',
      fromLocation: `${flight.fromCode} – ${flight.fromCity}`,
      toLocation: `${flight.toCode} – ${flight.toCity}`,
      departureTime: flight.departureTime || new Date().toISOString(),
      arrivalTime: flight.arrivalTime || new Date().toISOString(),
      price: flight.price,
    }).subscribe({
      next: () => { this.addingId.set(null); this.modalCtrl.dismiss({ added: true }); },
      error: () => this.addingId.set(null),
    });
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60); const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  getBookingUrl(flight: FlightOffer): string {
    const from = this.fromSel();
    const to = this.toSel();
    const params = new URLSearchParams({
      type: 'ONEWAY', adults: String(this.adults), cabinClass: this.cabinClass,
      from: from?.id ?? flight.fromCode, to: to?.id ?? flight.toCode,
      depart: this.departDate, token: flight.token,
    });
    return `https://flights.booking.com/flights/${from?.id ?? flight.fromCode}-${to?.id ?? flight.toCode}/?${params}`;
  }

  dismiss(): void { this.modalCtrl.dismiss(); }
}
