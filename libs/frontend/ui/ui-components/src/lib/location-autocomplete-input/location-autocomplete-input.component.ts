import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';

export interface LocationResult {
  city: string;
  country: string;
  lat: number;
  lng: number;
  displayName: string;
}

interface PhotonResponse {
  features: {
    geometry: { type: string; coordinates: [number, number] };
    properties: {
      name?: string;
      city?: string;
      town?: string;
      village?: string;
      country?: string;
      state?: string;
      type?: string;
    };
  }[];
}

@Component({
  selector: 'lib-location-autocomplete-input',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LocationAutocompleteInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="ac-wrap">
      @if (label) {
        <label class="ac-label">{{ label }}</label>
      }
      <div class="ac-input-box" [class.ac-input-box--focused]="isFocused()" [class.ac-input-box--error]="showError">
        <svg class="ac-pin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <input
          class="ac-input"
          type="text"
          [placeholder]="placeholder"
          [value]="query()"
          (input)="onInput($any($event.target).value)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (keydown)="onKeyDown($event)"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
        />
        @if (loading()) {
          <span class="ac-spinner"></span>
        } @else if (query()) {
          <button type="button" class="ac-clear" (mousedown)="$event.preventDefault(); clear()" tabindex="-1"
            aria-label="Clear">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        }
      </div>

      @if (isOpen()) {
        <div class="ac-dropdown" role="listbox">
          @if (showNoResults()) {
            <div class="ac-empty">No results found</div>
          } @else {
            @for (result of results(); track result.displayName; let i = $index) {
              <div
                class="ac-item"
                [class.ac-item--active]="activeIndex() === i"
                role="option"
                (mousedown)="$event.preventDefault()"
                (click)="select(result)"
              >
                <svg class="ac-item-pin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <div class="ac-item-body">
                  <span class="ac-item-city">{{ result.city }}</span>
                  <span class="ac-item-country">{{ result.country }}</span>
                </div>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .ac-wrap { position: relative; display: flex; flex-direction: column; gap: 5px; }

    .ac-label { font-size: 0.78rem; font-weight: 600; color: #374151; }

    .ac-input-box {
      position: relative; display: flex; align-items: center;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      background: white;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .ac-input-box--focused {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
    }
    .ac-input-box--error { border-color: #ef4444; }
    .ac-input-box--error.ac-input-box--focused { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }

    .ac-pin {
      position: absolute; left: 11px; color: #94a3b8; pointer-events: none; flex-shrink: 0;
    }
    .ac-input {
      width: 100%; border: none; outline: none; background: transparent;
      padding: 10px 34px 10px 32px;
      font-size: 0.875rem; color: #1e293b; font-family: inherit;
      box-sizing: border-box;
    }
    .ac-input::placeholder { color: #94a3b8; }

    /* Spinner */
    .ac-spinner {
      position: absolute; right: 10px;
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid #e2e8f0; border-top-color: #3b82f6;
      animation: ac-spin 0.65s linear infinite; flex-shrink: 0;
    }
    @keyframes ac-spin { to { transform: rotate(360deg); } }

    /* Clear */
    .ac-clear {
      position: absolute; right: 8px;
      background: none; border: none; cursor: pointer;
      color: #c7d0da; padding: 4px; border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      transition: color 0.1s; line-height: 0;
    }
    .ac-clear:hover { color: #64748b; }

    /* Dropdown */
    .ac-dropdown {
      position: absolute; top: calc(100% + 5px); left: 0; right: 0;
      background: white;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.11);
      z-index: 9999; overflow: hidden;
      max-height: 240px; overflow-y: auto;
    }

    .ac-empty {
      padding: 14px 16px;
      font-size: 0.875rem; color: #94a3b8; text-align: center;
    }

    .ac-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; cursor: pointer;
      transition: background 0.1s;
    }
    .ac-item:not(:last-child) { border-bottom: 1px solid #f8fafc; }
    .ac-item:hover, .ac-item--active { background: #f8fafc; }
    .ac-item-pin { color: #94a3b8; flex-shrink: 0; }
    .ac-item-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .ac-item-city { font-size: 0.875rem; font-weight: 600; color: #0f172a; }
    .ac-item-country { font-size: 0.75rem; color: #64748b; }
  `],
})
export class LocationAutocompleteInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() placeholder = 'Search city...';
  @Input() label = '';
  @Input() showError = false;
  @Output() locationSelected = new EventEmitter<LocationResult>();

  private readonly http = inject(HttpClient);
  private readonly elRef = inject(ElementRef);

  readonly query = signal('');
  readonly results = signal<LocationResult[]>([]);
  readonly loading = signal(false);
  readonly isOpen = signal(false);
  readonly activeIndex = signal(-1);
  readonly isFocused = signal(false);
  readonly showNoResults = signal(false);

  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();
  private onChange: (v: string) => void = () => { /* noop */ };
  private onTouched: () => void = () => { /* noop */ };

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.isOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) {
          this.results.set([]);
          this.loading.set(false);
          this.showNoResults.set(false);
          this.isOpen.set(false);
          return of(null);
        }
        this.loading.set(true);
        this.showNoResults.set(false);
        return this.http.get<PhotonResponse>(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`
        ).pipe(catchError(() => of(null)));
      }),
      takeUntil(this.destroy$),
    ).subscribe(response => {
      this.loading.set(false);
      if (response) {
        const parsed = this.parseResults(response);
        this.results.set(parsed);
        this.activeIndex.set(-1);
        this.showNoResults.set(parsed.length === 0);
        this.isOpen.set(true);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(value: string): void {
    this.query.set(value);
    this.onChange(value);
    this.searchSubject.next(value);
  }

  onFocus(): void {
    this.isFocused.set(true);
    if (this.results().length > 0) this.isOpen.set(true);
  }

  onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen()) return;
    const len = this.results().length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set(Math.min(this.activeIndex() + 1, len - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set(Math.max(this.activeIndex() - 1, 0));
        break;
      case 'Enter':
        if (this.activeIndex() >= 0) {
          event.preventDefault();
          this.select(this.results()[this.activeIndex()]);
        }
        break;
      case 'Escape':
        this.isOpen.set(false);
        break;
    }
  }

  select(result: LocationResult): void {
    this.query.set(result.city);
    this.onChange(result.city);
    this.locationSelected.emit(result);
    this.isOpen.set(false);
    this.results.set([]);
    this.showNoResults.set(false);
  }

  clear(): void {
    this.query.set('');
    this.onChange('');
    this.results.set([]);
    this.isOpen.set(false);
    this.showNoResults.set(false);
  }

  // ── ControlValueAccessor ──────────────────────────────────────

  writeValue(v: string): void {
    this.query.set(v ?? '');
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // ── Helpers ───────────────────────────────────────────────────

  private parseResults(response: PhotonResponse): LocationResult[] {
    const seen = new Set<string>();
    return response.features
      .map(f => {
        const p = f.properties;
        const city = p.name || p.city || p.town || p.village || '';
        const country = p.country || '';
        if (!city || !country) return null;
        const displayName = `${city}, ${country}`;
        if (seen.has(displayName)) return null;
        seen.add(displayName);
        return {
          city,
          country,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          displayName,
        };
      })
      .filter((r): r is LocationResult => r !== null);
  }
}
