import { Component, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TripMembersStore } from '../../store/trip-members.store';

@Component({
  selector: 'lib-invite-user-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Invite Member</h2>
          <button class="close-btn" (click)="onClose()">✕</button>
        </div>
        <form (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="email">Email *</label>
            <input
              id="email"
              [(ngModel)]="email"
              name="email"
              type="email"
              required
              placeholder="e.g. friend@email.com"
            />
          </div>
          <div class="field">
            <label for="role">Role *</label>
            <select id="role" [(ngModel)]="role" name="role">
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" (click)="onClose()">Cancel</button>
            <button type="submit" class="btn-submit" [disabled]="!email">Send Invite</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center; z-index: 100;
    }
    .modal {
      background: white; border-radius: 12px; padding: 32px;
      width: 100%; max-width: 440px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .modal-header h2 { margin: 0; font-size: 1.15rem; }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #666; }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .field label { font-size: 0.875rem; font-weight: 500; color: #374151; }
    .field input, .field select {
      border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 12px;
      font-size: 0.95rem; outline: none; background: white;
    }
    .field input:focus, .field select:focus { border-color: #4285f4; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
    .btn-cancel { background: none; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
    .btn-submit {
      background: #4285f4; color: white; border: none;
      padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 0.95rem;
    }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-submit:not(:disabled):hover { background: #3367d6; }
  `],
})
export class InviteUserModalComponent {
  private readonly store = inject(TripMembersStore);

  readonly closed = output<void>();

  email = '';
  role: 'EDITOR' | 'VIEWER' = 'EDITOR';

  onClose(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    if (!this.email) return;
    this.store.inviteUser({ email: this.email, role: this.role }, () => this.closed.emit());
  }
}
