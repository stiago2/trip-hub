import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { firstValueFrom } from 'rxjs';
import { AuthService, AuthStore } from '@org/feature-auth';

const NATIVE_API = 'https://trip-hub-production.up.railway.app/api';

@Injectable({ providedIn: 'root' })
export class MobileAuthService {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Initiates Google OAuth:
   * - Web: standard redirect (same as existing web app)
   * - Native: opens in-app browser, listens for deep link callback
   */
  async loginWithGoogle(): Promise<void> {
    if (!this.isNative) {
      // Redirect directo — el backend redirige a localhost:4300/auth/callback
      window.location.href = '/api/auth/google/mobile-web';
      return;
    }

    // Native flow: usa el endpoint de producción ya registrado en Google Console
    const authUrl = `${NATIVE_API}/auth/google`;

    // Listen for the deep link before opening the browser
    const listener = await App.addListener('appUrlOpen', async (data) => {
      await listener.remove();
      await Browser.close();
      await this.handleDeepLink(data.url);
    });

    await Browser.open({
      url: authUrl,
      windowName: '_self',
      presentationStyle: 'popover',
    });
  }

  /**
   * Handles the deep link: triphub://auth/callback?token=xxx
   */
  async handleDeepLink(url: string): Promise<void> {
    try {
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get('token');
      if (!token) {
        this.router.navigate(['/login'], { replaceUrl: true });
        return;
      }
      this.authService.setToken(token);
      const user = await firstValueFrom(this.authService.getCurrentUser());
      this.authStore.setUser(user);
      this.router.navigate(['/trips'], { replaceUrl: true });
    } catch {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
