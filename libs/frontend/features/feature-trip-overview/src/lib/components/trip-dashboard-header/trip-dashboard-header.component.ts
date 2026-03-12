import { SlicePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { TripMember } from '@org/util-types';

@Component({
  selector: 'lib-trip-dashboard-header',
  standalone: true,
  imports: [SlicePipe, UpperCasePipe],
  template: `
    <div class="dash-header">
      <div class="members-section">
        <div class="avatar-stack">
          @for (member of visibleMembers(); track member.id) {
            <div class="avatar" [title]="member.user.name || member.user.email">
              {{ (member.user.name || member.user.email) | slice:0:1 | uppercase }}
            </div>
          }
          @if (overflowCount() > 0) {
            <div class="avatar avatar--overflow">+{{ overflowCount() }}</div>
          }
        </div>
        @if (members().length > 0) {
          <div class="members-info">
            <span class="members-label">{{ members().length }} traveler{{ members().length !== 1 ? 's' : '' }}</span>
            <span class="members-sub">on this trip</span>
          </div>
        }
      </div>
      <div class="header-actions">
        <span class="overview-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Overview
        </span>
      </div>
    </div>
  `,
  styles: [`
    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 22px;
    }

    .members-section { display: flex; align-items: center; gap: 12px; }

    .avatar-stack { display: flex; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #6366f1); color: white;
      font-size: 0.78rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2.5px solid #f1f5f9; margin-left: -10px;
      box-shadow: 0 2px 6px rgba(59,130,246,0.3);
    }
    .avatar-stack .avatar:first-child { margin-left: 0; }
    .avatar--overflow {
      background: #e2e8f0; color: #475569; font-size: 0.7rem;
      box-shadow: none;
    }

    .members-info { display: flex; flex-direction: column; gap: 1px; }
    .members-label { font-size: 0.875rem; font-weight: 700; color: #0f172a; }
    .members-sub { font-size: 0.75rem; color: #94a3b8; }

    .overview-badge {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.78rem; font-weight: 600; color: #6366f1;
      background: #eef2ff; border: 1px solid #e0e7ff;
      padding: 5px 12px; border-radius: 20px;
    }
  `],
})
export class TripDashboardHeaderComponent {
  readonly members = input<TripMember[]>([]);

  readonly visibleMembers = computed(() => this.members().slice(0, 3));
  readonly overflowCount = computed(() => Math.max(0, this.members().length - 3));
}
