import { SlicePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

export interface UserProfileData {
  name?: string | null;
  email: string;
}

@Component({
  selector: 'lib-user-profile-widget',
  standalone: true,
  imports: [SlicePipe, TitleCasePipe, UpperCasePipe],
  template: `
    <div class="user-row">
      <div class="user-avatar">
        {{ (user().name || user().email) | slice:0:1 | uppercase }}
      </div>
      <div class="user-info">
        <span class="user-name">{{ (user().name || user().email) | titlecase }}</span>
        <span class="user-plan">Premium Member</span>
      </div>
      <button class="logout-icon-btn" (click)="logoutClick.emit()" title="Sign out">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .user-row {
      display: flex; align-items: center; gap: 9px;
      padding: 10px; border-radius: 10px;
      background: rgba(255,255,255,0.06);
    }
    .user-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.82rem; font-weight: 700; flex-shrink: 0;
    }
    .user-info {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column; gap: 1px;
    }
    .user-name {
      font-size: 0.8rem; font-weight: 600; color: #f1f5f9;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .user-plan {
      font-size: 0.72rem; color: #94a3b8;
    }
    .logout-icon-btn {
      background: none; border: none; cursor: pointer;
      color: #64748b; padding: 4px; border-radius: 6px;
      display: flex; align-items: center;
      transition: color 0.15s; flex-shrink: 0;
    }
    .logout-icon-btn:hover { color: #f87171; }
  `],
})
export class UserProfileWidgetComponent {
  user = input.required<UserProfileData>();
  logoutClick = output<void>();
}
