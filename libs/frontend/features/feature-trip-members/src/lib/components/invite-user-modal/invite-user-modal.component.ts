import { Component, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TripMembersStore } from '../../store/trip-members.store';

@Component({
  selector: 'lib-invite-user-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">Invite Member</h2>
            <p class="modal-subtitle">Send an invitation to collaborate on this trip.</p>
          </div>
          <button class="modal-close-btn" type="button" (click)="onClose()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="modal-body">
            <div class="field-group">
              <label class="field-label" for="email">Email</label>
              <input
                id="email"
                class="field-input"
                formControlName="email"
                type="email"
                placeholder="e.g. friend@email.com"
              />
            </div>
            <div class="field-group">
              <label class="field-label" for="role">Role</label>
              <div class="select-wrapper">
                <select id="role" class="field-select" formControlName="role">
                  <option value="EDITOR">Editor</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <svg class="select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="onClose()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || submitting()">
              @if (submitting()) {
                <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              }
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    form { display: contents; }
    .select-wrapper { position: relative; }
    .field-select {
      width: 100%; border: 1.5px solid var(--color-border); border-radius: var(--radius-lg);
      padding: 10px 36px 10px 14px; font-size: var(--font-size-base); color: var(--color-text);
      outline: none; appearance: none; background: var(--color-surface); cursor: pointer;
      transition: border-color 150ms; box-sizing: border-box;
    }
    .field-select:focus { border-color: var(--color-border-focus); }
    .select-chevron {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      pointer-events: none; color: var(--color-text-muted);
    }
  `],
})
export class InviteUserModalComponent {
  private readonly store = inject(TripMembersStore);
  private readonly fb = inject(FormBuilder);

  readonly closed = output<void>();
  readonly submitting = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['EDITOR' as 'EDITOR' | 'VIEWER', Validators.required],
  });

  onClose(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const { email, role } = this.form.getRawValue();
    this.submitting.set(true);
    this.store.inviteUser(
      { email: email!, role: role! },
      () => this.closed.emit(),
      () => this.submitting.set(false),
    );
  }
}
