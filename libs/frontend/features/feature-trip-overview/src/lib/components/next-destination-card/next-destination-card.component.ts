import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Destination } from '@org/util-types';

const GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
  'linear-gradient(135deg, #232526 0%, #414345 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)',
];

@Component({
  selector: 'lib-next-destination-card',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="preview-card card">
      <div class="card-header">
        <span class="card-title">Next Destination</span>
      </div>

      @if (destination()) {
        <div class="hero-card" [style.background]="gradient()">
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <div class="hero-top">
              <span class="date-badge">
                {{ destination()!.startDate | date:'MMM d' }} – {{ destination()!.endDate | date:'MMM d' }}
              </span>
            </div>
            <div class="hero-bottom">
              <div class="hero-info">
                <p class="destination-country">{{ destination()!.country }}</p>
                <h3 class="destination-name">{{ destination()!.city }}</h3>
              </div>
              <a class="btn-itinerary" [routerLink]="['/trips', tripId(), 'destinations']">
                View itinerary
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
          </div>
        </div>
      } @else {
        <div class="empty-card">
          <div class="empty-icon-wrap">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          <p class="empty-title">No destinations planned yet</p>
          <p class="empty-desc">Add destinations to start building your itinerary</p>
          <a class="btn-add-destination" [routerLink]="['/trips', tripId(), 'destinations']">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Destination
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .preview-card {
      padding: var(--space-5);
    }
    .card-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: var(--space-4); padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--color-surface-muted);
    }
    .card-title { font-size: var(--font-size-body); font-weight: var(--font-weight-bold); color: var(--color-text); }

    .hero-card {
      position: relative;
      height: 250px;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.18);
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 50%, transparent 100%);
    }

    .hero-content {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: var(--space-5) var(--space-6);
    }

    .hero-top { display: flex; }
    .date-badge {
      background: rgba(255,255,255,0.18);
      backdrop-filter: blur(8px);
      color: white;
      font-size: 0.75rem;
      font-weight: var(--font-weight-bold);
      padding: 5px 12px;
      border-radius: var(--radius-3xl);
      letter-spacing: 0.03em;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .hero-bottom {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: var(--space-3);
    }

    .destination-country {
      margin: 0 0 2px;
      font-size: var(--font-size-caption);
      font-weight: var(--font-weight-medium);
      color: rgba(255,255,255,0.7);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wider);
    }
    .destination-name {
      margin: 0;
      font-size: 1.75rem;
      font-weight: var(--font-weight-extrabold);
      color: white;
      text-shadow: 0 1px 4px rgba(0,0,0,0.3);
      letter-spacing: var(--tracking-tight);
    }

    .btn-itinerary {
      display: flex;
      align-items: center;
      gap: 5px;
      background: white;
      color: var(--color-text);
      text-decoration: none;
      font-size: var(--font-size-body);
      font-weight: var(--font-weight-semibold);
      padding: 10px 18px;
      border-radius: var(--radius-lg);
      transition: opacity var(--transition-fast), transform var(--transition-fast);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .btn-itinerary:hover { opacity: 0.9; transform: translateY(-1px); }

    .empty-card {
      height: 220px;
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-2xl);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      background: var(--color-surface-subtle);
    }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: var(--radius-2xl);
      background: var(--color-surface-muted);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
    }
    .empty-title { margin: 0; color: var(--color-text); font-size: 0.95rem; font-weight: var(--font-weight-bold); }
    .empty-desc { margin: 0; color: var(--color-text-subtle); font-size: 0.85rem; text-align: center; }
    .btn-add-destination {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      background: var(--color-action);
      color: white;
      text-decoration: none;
      font-size: var(--font-size-body);
      font-weight: var(--font-weight-semibold);
      padding: 10px var(--space-5);
      border-radius: var(--radius-lg);
      transition: background var(--transition-fast), transform var(--transition-fast);
    }
    .btn-add-destination:hover { background: var(--color-action-hover); transform: translateY(-1px); }

    @media (max-width: 600px) {
      .hero-card { height: 190px; }
      .hero-content { padding: 14px 16px; }
      .destination-name { font-size: 1.25rem; }
      .btn-itinerary { padding: 8px 12px; font-size: 0.8rem; }
    }
  `],
})
export class NextDestinationCardComponent {
  readonly destination = input<Destination | null>(null);
  readonly tripId = input('');

  readonly gradient = computed(() => {
    const dest = this.destination();
    if (!dest) return GRADIENTS[0];
    const idx = dest.city.charCodeAt(0) % GRADIENTS.length;
    return GRADIENTS[idx];
  });
}
