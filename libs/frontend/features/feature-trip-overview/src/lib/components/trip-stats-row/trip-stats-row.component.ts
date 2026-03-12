import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lib-trip-stats-row',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  template: `
    <div class="stats-row">

      <a class="stat-card stat-card--blue" [routerLink]="['/trips', tripId(), 'destinations']">
        <div class="stat-top">
          <span class="stat-label">Destinations</span>
          <span class="stat-icon stat-icon--blue">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </span>
        </div>
        <span class="stat-value">{{ destinationCount() }}</span>
        @if (destinationCount() === 0) {
          <span class="stat-hint">Add your first destination</span>
        } @else {
          <span class="stat-hint stat-hint--positive">{{ destinationCount() }} place{{ destinationCount() !== 1 ? 's' : '' }} planned</span>
        }
      </a>

      <a class="stat-card stat-card--green" [routerLink]="['/trips', tripId(), 'budget']">
        <div class="stat-top">
          <span class="stat-label">Budget</span>
          <span class="stat-icon stat-icon--green">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </span>
        </div>
        <span class="stat-value stat-value--budget">{{ totalBudget() | currency }}</span>
        @if (totalBudget() === 0) {
          <span class="stat-hint">Track expenses</span>
        } @else {
          <span class="stat-hint stat-hint--positive">Total logged</span>
        }
      </a>

      <a class="stat-card stat-card--amber" [routerLink]="['/trips', tripId(), 'inventory']">
        <div class="stat-top">
          <span class="stat-label">Items Packed</span>
          <span class="stat-icon stat-icon--amber">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
        </div>
        <span class="stat-value">{{ packedCount() }}<span class="stat-value-total">/{{ totalItems() }}</span></span>
        @if (totalItems() === 0) {
          <span class="stat-hint">Start packing list</span>
        } @else if (packedCount() === totalItems()) {
          <span class="stat-hint stat-hint--positive">All packed!</span>
        } @else {
          <span class="stat-hint">{{ totalItems() - packedCount() }} item{{ (totalItems() - packedCount()) !== 1 ? 's' : '' }} remaining</span>
        }
      </a>

      <a class="stat-card stat-card--purple" [routerLink]="['/trips', tripId(), 'members']">
        <div class="stat-top">
          <span class="stat-label">Members</span>
          <span class="stat-icon stat-icon--purple">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </span>
        </div>
        <span class="stat-value">{{ memberCount() }}</span>
        @if (memberCount() === 0) {
          <span class="stat-hint">Invite travelers</span>
        } @else {
          <span class="stat-hint stat-hint--positive">{{ memberCount() }} traveler{{ memberCount() !== 1 ? 's' : '' }}</span>
        }
      </a>

    </div>
  `,
  styles: [`
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    @media (max-width: 700px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }

    .stat-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 18px 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: box-shadow 0.18s, transform 0.18s;
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: var(--accent-bar);
      border-radius: 16px 16px 0 0;
    }
    .stat-card--blue  { --accent-bar: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .stat-card--green { --accent-bar: linear-gradient(90deg, #22c55e, #4ade80); }
    .stat-card--amber { --accent-bar: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .stat-card--purple { --accent-bar: linear-gradient(90deg, #8b5cf6, #a78bfa); }

    .stat-card:hover {
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.10);
      transform: translateY(-2px);
    }

    .stat-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #94a3b8;
    }

    .stat-icon {
      width: 34px; height: 34px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon--blue { background: #eff6ff; color: #3b82f6; }
    .stat-icon--green { background: #f0fdf4; color: #22c55e; }
    .stat-icon--amber { background: #fffbeb; color: #f59e0b; }
    .stat-icon--purple { background: #faf5ff; color: #8b5cf6; }

    .stat-value {
      font-size: 2.1rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .stat-value--budget { font-size: 1.6rem; }
    .stat-value-total { font-size: 1.1rem; font-weight: 600; color: #94a3b8; }

    .stat-hint {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
    }
    .stat-hint--positive { color: #22c55e; font-weight: 600; }
  `],
})
export class TripStatsRowComponent {
  readonly tripId = input('');
  readonly destinationCount = input(0);
  readonly totalBudget = input(0);
  readonly packedCount = input(0);
  readonly totalItems = input(0);
  readonly memberCount = input(0);
}
