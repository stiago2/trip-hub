import { SlicePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TripStore } from '@org/data-access-trips';
import { TripMembersStore } from '../store/trip-members.store';
import { InviteUserModalComponent } from '../components/invite-user-modal/invite-user-modal.component';

const AVATAR_COLORS: [string, string][] = [
  ['#ede9fe', '#7c3aed'],
  ['#dbeafe', '#1d4ed8'],
  ['#d1fae5', '#065f46'],
  ['#fef3c7', '#92400e'],
  ['#fce7f3', '#9d174d'],
];

@Component({
  selector: 'lib-members-page',
  standalone: true,
  imports: [InviteUserModalComponent, SlicePipe, UpperCasePipe, TitleCasePipe],
  template: `
    <div class="members-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Trip Members</h2>
          <p class="page-subtitle">Manage your travel team and their access levels here.</p>
        </div>
      </div>

      <!-- Search + Invite bar -->
      <div class="toolbar">
        <div class="search-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            class="search-input"
            type="text"
            placeholder="Search members by name or email..."
            [value]="searchQuery()"
            (input)="searchQuery.set($any($event.target).value)"
          />
        </div>
        <button class="btn-invite" (click)="showModal.set(true)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>
          Invite Member
        </button>
      </div>

      <!-- Table card -->
      <div class="table-card card">
        @if (store.loading()) {
          <p class="state-msg">Loading...</p>
        } @else {
          <table class="members-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (member of filteredMembers(); track member.id) {
                <tr class="member-row">
                  <td class="col-member">
                    <div class="member-cell">
                      <div class="avatar" [style.background]="avatarBg(member.user.name || member.user.email)" [style.color]="avatarColor(member.user.name || member.user.email)">
                        {{ (member.user.name || member.user.email) | slice:0:1 | uppercase }}
                      </div>
                      <span class="member-name">{{ member.user.name || member.user.email }}</span>
                    </div>
                  </td>
                  <td class="col-email">{{ member.user.email }}</td>
                  <td class="col-role">
                    <span class="role-pill">{{ member.role | titlecase }}</span>
                  </td>
                  <td class="col-status">
                    <span class="status-active">
                      <span class="dot dot--green"></span>Active
                    </span>
                  </td>
                  <td class="col-action">
                    <button class="btn-menu" title="Options">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                    </button>
                  </td>
                </tr>
              }
              @for (inv of filteredInvitations(); track inv.id) {
                <tr class="member-row member-row--invited">
                  <td class="col-member">
                    <div class="member-cell">
                      <div class="avatar avatar--invited">
                        {{ inv.email | slice:0:1 | uppercase }}
                      </div>
                      <span class="member-name member-name--muted">{{ inv.email }}</span>
                    </div>
                  </td>
                  <td class="col-email">{{ inv.email }}</td>
                  <td class="col-role">
                    <span class="role-pill">{{ inv.role | titlecase }}</span>
                  </td>
                  <td class="col-status">
                    @switch (inv.status) {
                      @case ('PENDING') {
                        <span class="status-invited"><span class="dot dot--yellow"></span>Invited</span>
                      }
                      @case ('ACCEPTED') {
                        <span class="status-active"><span class="dot dot--green"></span>Active</span>
                      }
                      @case ('DECLINED') {
                        <span class="status-declined"><span class="dot dot--red"></span>Declined</span>
                      }
                    }
                  </td>
                  <td class="col-action">
                    <button class="btn-menu" title="Options">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                    </button>
                  </td>
                </tr>
              }
              @if (filteredMembers().length === 0 && filteredInvitations().length === 0) {
                <tr>
                  <td colspan="5" class="empty-cell">
                    @if (searchQuery()) {
                      No results for "{{ searchQuery() }}"
                    } @else {
                      No members yet. Invite someone to get started.
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Footer -->
          <div class="table-footer">
            <span class="footer-count">Showing {{ totalShown() }} of {{ totalCount() }} members</span>
            <div class="pagination">
              <button class="page-btn" disabled>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button class="page-btn" disabled>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        }
      </div>
    </div>

    @if (showModal()) {
      <lib-invite-user-modal (closed)="showModal.set(false)" />
    }
  `,
  styles: [`
    .members-page { padding: var(--space-2) 0; }

    /* Header */
    .page-subtitle { margin: 0; font-size: var(--font-size-body); color: var(--color-text-soft); }

    /* Toolbar */
    .toolbar { display: flex; gap: var(--space-3); align-items: center; margin-bottom: var(--space-5); }

    .search-wrap {
      flex: 1; position: relative; display: flex; align-items: center;
    }
    .search-icon { position: absolute; left: 12px; pointer-events: none; }
    .search-input {
      width: 100%; padding: 10px var(--space-3) 10px 38px;
      border: 1px solid var(--color-border); border-radius: var(--radius-lg);
      font-size: var(--font-size-body); color: var(--color-dark-surface); outline: none; background: var(--color-surface);
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    .search-input:focus { border-color: var(--color-action); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .search-input::placeholder { color: var(--color-text-subtle); }

    .btn-invite {
      display: flex; align-items: center; gap: 7px; white-space: nowrap;
      background: var(--color-action); color: white; border: none;
      padding: 10px 18px; border-radius: var(--radius-lg); cursor: pointer;
      font-size: var(--font-size-body); font-weight: var(--font-weight-semibold);
    }
    .btn-invite:hover { background: var(--color-action-hover); }

    /* Table card */
    .table-card {
      border-radius: 14px;
      overflow: hidden;
    }

    .state-msg { padding: 20px; color: var(--color-text-subtle); font-size: 0.9rem; }

    .members-table { width: 100%; border-collapse: collapse; }
    .members-table thead th {
      padding: var(--space-3) var(--space-5);
      text-align: left;
      font-size: 0.72rem; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: var(--tracking-wide);
      color: var(--color-text-subtle);
      background: var(--color-surface-subtle);
      border-bottom: 1px solid var(--color-surface-muted);
    }

    .member-row td { padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--color-surface-subtle); vertical-align: middle; }
    .member-row:last-child td { border-bottom: none; }
    .member-row:hover td { background: #fafbfd; }

    /* Member cell */
    .col-member { min-width: 200px; }
    .member-cell { display: flex; align-items: center; gap: var(--space-3); }
    .avatar {
      width: 38px; height: 38px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-body); font-weight: var(--font-weight-bold); flex-shrink: 0;
    }
    .avatar--invited { background: var(--color-surface-muted); color: var(--color-text-subtle); }
    .member-name { font-size: 0.9rem; font-weight: var(--font-weight-semibold); color: var(--color-text); }
    .member-name--muted { color: var(--color-text-soft); }

    /* Email */
    .col-email { font-size: 0.85rem; color: var(--color-text-soft); }

    /* Role pill */
    .col-role { }
    .role-pill {
      display: inline-block;
      padding: 4px var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      font-size: var(--font-size-caption);
      font-weight: var(--font-weight-medium);
      color: #475569;
      background: var(--color-surface);
    }

    /* Status */
    .col-status { }
    .status-active, .status-invited, .status-declined {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 0.85rem; font-weight: var(--font-weight-medium);
    }
    .status-active { color: var(--color-dark-surface); }
    .status-invited { color: #92400e; }
    .status-declined { color: #991b1b; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot--green  { background: #22c55e; }
    .dot--yellow { background: #f59e0b; }
    .dot--red    { background: var(--color-danger); }

    /* Action */
    .col-action { width: 48px; text-align: center; }
    .btn-menu {
      background: none; border: none; color: var(--color-text-subtle); cursor: pointer;
      padding: 6px; border-radius: 6px;
      transition: color var(--transition-fast), background var(--transition-fast);
    }
    .btn-menu:hover { color: var(--color-dark-surface); background: var(--color-surface-muted); }

    /* Empty */
    .empty-cell { text-align: center; padding: 40px; font-size: var(--font-size-body); color: var(--color-text-subtle); }

    /* Footer */
    .table-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px var(--space-5);
      border-top: 1px solid var(--color-surface-muted);
    }
    .footer-count { font-size: 0.82rem; color: var(--color-text-soft); }
    .pagination { display: flex; gap: 4px; }
    .page-btn {
      background: var(--color-surface); border: 1px solid var(--color-border);
      width: 32px; height: 32px; border-radius: var(--radius-md); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--color-text-soft); transition: background var(--transition-fast);
    }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-btn:not(:disabled):hover { background: var(--color-surface-muted); }

    @media (max-width: 600px) {
      .page-title { font-size: 1.1rem; }
      .toolbar { gap: var(--space-2); }
      .btn-invite { padding: var(--space-2) var(--space-3); font-size: 0.8rem; gap: 5px; }
    }
  `],
})
export class MembersPageComponent {
  readonly store = inject(TripMembersStore);
  readonly showModal = signal(false);
  constructor() {
    const title = inject(Title);
    const tripStore = inject(TripStore);
    effect(() => {
      const name = tripStore.trip()?.title;
      title.setTitle(name ? `Team · ${name} — TripHub` : 'Team — TripHub');
    });
  }
  readonly searchQuery = signal('');

  readonly pendingInvitations = this.store.invitations;

  readonly filteredMembers = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.store.members();
    return this.store.members().filter(
      (m) =>
        (m.user.name || '').toLowerCase().includes(q) ||
        m.user.email.toLowerCase().includes(q)
    );
  });

  readonly filteredInvitations = computed(() => {
    const q = this.searchQuery().toLowerCase();
    // Only show PENDING/DECLINED invitations — ACCEPTED users already appear in members list
    const pending = this.store.invitations().filter((i) => i.status !== 'ACCEPTED');
    if (!q) return pending;
    return pending.filter((i) => i.email.toLowerCase().includes(q));
  });

  readonly totalShown = computed(() => this.filteredMembers().length + this.filteredInvitations().length);
  readonly totalCount = computed(() => this.store.members().length + this.store.invitations().length);


  avatarBg(name: string): string {
    return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length][0];
  }

  avatarColor(name: string): string {
    return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length][1];
  }

}
