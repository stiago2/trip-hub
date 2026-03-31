import { Component, inject, signal } from '@angular/core';
import {
  IonContent, IonButton, IonSpinner,
} from '@ionic/angular/standalone';
import { MobileAuthService } from '../../services/mobile-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonContent, IonButton, IonSpinner],
  template: `
    <ion-content class="login-content">
      <div class="login-wrap">

        <!-- Logo -->
        <div class="logo-block">
          <div class="logo-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
          </div>
          <h1 class="logo-name">TripHub</h1>
          <p class="logo-sub">Your travel planning hub</p>
        </div>

        <!-- Hero text -->
        <div class="hero-block">
          <h2 class="hero-heading">Plan trips,<br>travel together.</h2>
          <p class="hero-desc">
            Destinations, budgets, packing lists, and more —
            all in one place for your whole crew.
          </p>
        </div>

        <!-- CTA -->
        <div class="cta-block">
          <button class="google-btn" (click)="login()" [disabled]="loading()">
            @if (loading()) {
              <ion-spinner name="crescent" style="width:20px;height:20px;color:#fff"></ion-spinner>
            } @else {
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.78h5.39c-.23 1.22-.94 2.25-2 2.93v2.44h3.24c1.9-1.75 3-4.32 3-7.15z" fill="#4285F4"/>
                <path d="M10 20c2.7 0 4.96-.9 6.61-2.42l-3.24-2.44c-.89.6-2.04.96-3.37.96-2.6 0-4.8-1.75-5.58-4.1H1.07v2.52C2.72 17.74 6.1 20 10 20z" fill="#34A853"/>
                <path d="M4.42 11.99c-.2-.6-.31-1.24-.31-1.9s.11-1.3.31-1.9V5.67H1.07A9.97 9.97 0 000 10c0 1.61.39 3.13 1.07 4.48l3.35-2.5z" fill="#FBBC05"/>
                <path d="M10 3.96c1.47 0 2.79.5 3.83 1.49l2.87-2.87C14.96.98 12.7 0 10 0 6.1 0 2.72 2.26 1.07 5.57l3.35 2.5C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/>
              </svg>
            }
            Continue with Google
          </button>
          <p class="disclaimer">Free to use · No credit card required</p>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    .login-content { --background: linear-gradient(160deg, #eff6ff 0%, #f8fafc 60%, #f0fdf4 100%); }

    .login-wrap {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 100%; padding: 48px 32px;
      gap: 40px; text-align: center; max-width: 380px; margin: 0 auto;
    }

    .logo-block { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .logo-icon {
      width: 72px; height: 72px; border-radius: 20px; background: #2563eb;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(37,99,235,0.3);
    }
    .logo-name { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0; }
    .logo-sub { font-size: 0.9rem; color: #64748b; margin: 0; }

    .hero-block { display: flex; flex-direction: column; gap: 12px; }
    .hero-heading { font-size: 1.9rem; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2; }
    .hero-desc { font-size: 1rem; color: #64748b; margin: 0; line-height: 1.6; }

    .cta-block { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; }
    .google-btn {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; padding: 14px 20px; border-radius: 14px;
      background: #2563eb; color: white; border: none;
      font-size: 1rem; font-weight: 600; cursor: pointer;
      box-shadow: 0 4px 16px rgba(37,99,235,0.3);
      transition: opacity 0.15s, transform 0.15s;
    }
    .google-btn:active { opacity: 0.85; transform: scale(0.98); }
    .google-btn:disabled { opacity: 0.7; }
    .disclaimer { font-size: 0.78rem; color: #94a3b8; margin: 0; }
  `],
})
export class LoginPage {
  private readonly mobileAuth = inject(MobileAuthService);
  readonly loading = signal(false);

  async login(): Promise<void> {
    this.loading.set(true);
    try {
      await this.mobileAuth.loginWithGoogle();
    } finally {
      this.loading.set(false);
    }
  }
}
