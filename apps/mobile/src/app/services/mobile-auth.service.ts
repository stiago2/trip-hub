import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { firstValueFrom } from 'rxjs';
import { AuthService, AuthStore } from '@org/feature-auth';

const NATIVE_API = 'https://trip-hub-production.up.railway.app/api';
// Web app URL — el OAuth redirige ahí, usamos popup + postMessage
const WEB_APP_ORIGIN = 'http://192.168.1.10:4200';

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
      return this.loginWithPopup();
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
   * Web browser flow: abre el OAuth en un popup, espera el token via postMessage
   */
  private loginWithPopup(): Promise<void> {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        `${WEB_APP_ORIGIN}/api/auth/google`,
        'google-oauth',
        'width=520,height=620,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('No se pudo abrir el popup'));
        return;
      }

      const handler = async (event: MessageEvent) => {
        if (event.origin !== WEB_APP_ORIGIN) return;
        if (event.data?.type !== 'oauth-token') return;

        window.removeEventListener('message', handler);
        const token = event.data.token as string;
        try {
          this.authService.setToken(token);
          const user = await firstValueFrom(this.authService.getCurrentUser());
          this.authStore.setUser(user);
          this.router.navigate(['/trips'], { replaceUrl: true });
          resolve();
        } catch {
          reject(new Error('Error al obtener el usuario'));
        }
      };

      window.addEventListener('message', handler);
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
