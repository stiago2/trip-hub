import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'lib-toast-container',
  standalone: true,
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}" role="alert">
          <div class="toast-icon">
            @if (toast.type === 'success') {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            } @else if (toast.type === 'error') {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            } @else {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/>
              </svg>
            }
          </div>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 360px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08);
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.4;
      pointer-events: all;
      animation: toast-in 0.22s ease;
    }

    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }

    .toast--success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .toast--error   { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .toast--info    { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }

    .toast-icon { flex-shrink: 0; display: flex; align-items: center; }
    .toast-message { flex: 1; }

    .toast-close {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      color: inherit;
      opacity: 0.6;
      border-radius: 4px;
    }
    .toast-close:hover { opacity: 1; }

    @media (max-width: 480px) {
      .toast-container {
        bottom: 16px;
        right: 16px;
        left: 16px;
        max-width: none;
      }
    }
  `],
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
