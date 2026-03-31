import { Component, inject, OnInit } from '@angular/core';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { MobileAuthService } from '../../services/mobile-auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [IonContent, IonSpinner],
  template: `
    <ion-content class="callback-content">
      <div class="callback-wrap">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Signing you in…</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .callback-content { --background: #f8fafc; }
    .callback-wrap {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 100%; gap: 16px; color: #64748b;
    }
  `],
})
export class AuthCallbackPage implements OnInit {
  private readonly mobileAuth = inject(MobileAuthService);

  async ngOnInit(): Promise<void> {
    // Handles the web OAuth redirect: /auth/callback?token=xxx
    await this.mobileAuth.handleDeepLink(window.location.href);
  }
}
