import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AuthService, AuthStore } from '@org/feature-auth';

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
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      this.authService.setToken(token);
      try {
        const user = await firstValueFrom(this.authService.getCurrentUser());
        this.authStore.setUser(user);
        this.router.navigate(['/trips'], { replaceUrl: true });
      } catch {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    } else {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
