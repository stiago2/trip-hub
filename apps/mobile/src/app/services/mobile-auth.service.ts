import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { firstValueFrom } from 'rxjs';
import { AuthService, AuthStore } from '@org/feature-auth';

const API = '/api';
// On native, the backend is the real server — not the proxy
const NATIVE_API = 'http://localhost:3000/api';

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
      // Web flow: same as existing app
      window.location.href = `${API}/auth/google`;
      return;
    }

    // Native flow: open in-app browser with mobile OAuth endpoint
    const authUrl = `${NATIVE_API}/auth/google/mobile`;

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
