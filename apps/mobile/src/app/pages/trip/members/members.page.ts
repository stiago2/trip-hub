import { Component, inject, signal } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonIcon, IonAvatar, IonSkeletonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, personCircleOutline } from 'ionicons/icons';
import { TripStore } from '@org/data-access-trips';
import { TripMembersApiService } from '@org/feature-trip-members';
import { TripMember } from '@org/util-types';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonIcon, IonAvatar, IonSkeletonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>Members</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (loading()) {
        <div class="list-wrap">
          @for (i of [1,2,3]; track i) {
            <ion-skeleton-text animated style="height:60px;border-radius:14px;margin-bottom:8px"></ion-skeleton-text>
          }
        </div>
      } @else if (members().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><ion-icon name="people-outline"></ion-icon></div>
          <h3>No members</h3>
          <p>Invite people from the web app</p>
        </div>
      } @else {
        <div class="list-wrap">
          @for (m of members(); track m.id) {
            <div class="member-row">
              <ion-avatar class="avatar">
                <ion-icon name="person-circle-outline"></ion-icon>
              </ion-avatar>
              <div class="member-info">
                <div class="member-name">{{ m.user.name ?? m.user.email }}</div>
                <div class="member-email">{{ m.user.email }}</div>
              </div>
              <span class="role-badge" [class]="'role-' + m.role.toLowerCase()">{{ m.role }}</span>
            </div>
          }
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .list-wrap { padding: 16px; }

    .member-row {
      display: flex; align-items: center; gap: 12px;
      background: #fff; border-radius: 14px; padding: 12px 14px;
      margin-bottom: 8px; box-shadow: 0 1px 8px rgba(15,23,42,0.06);
    }
    .avatar {
      width: 40px; height: 40px; background: #eff6ff;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; color: #2563eb; flex-shrink: 0;
    }
    .member-info { flex: 1; }
    .member-name { font-size: 0.9rem; font-weight: 600; color: #0f172a; }
    .member-email { font-size: 0.75rem; color: #94a3b8; }

    .role-badge {
      font-size: 0.7rem; font-weight: 700; padding: 3px 8px;
      border-radius: 20px; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .role-owner  { background: #dbeafe; color: #1d4ed8; }
    .role-editor { background: #d1fae5; color: #065f46; }
    .role-viewer { background: #f1f5f9; color: #475569; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 80px 32px; gap: 12px; text-align: center;
    }
    .empty-icon {
      width: 72px; height: 72px; border-radius: 20px; background: #eff6ff;
      display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #2563eb;
    }
    .empty-state h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .empty-state p  { margin: 0; font-size: 0.9rem; color: #64748b; }
  `],
})
export class MembersPage {
  private readonly tripStore = inject(TripStore);
  private readonly api = inject(TripMembersApiService);

  readonly members = signal<TripMember[]>([]);
  readonly loading = signal(false);

  constructor() {
    addIcons({ peopleOutline, personCircleOutline });
    this.load();
  }

  private load(): void {
    const id = this.tripStore.activeTripId();
    if (!id) return;
    this.loading.set(true);
    this.api.getMembers(id).subscribe({
      next: (members) => { this.members.set(members); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
