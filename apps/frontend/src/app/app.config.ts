import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { appRoutes } from './app.routes';
import { AuthService, AuthStore, authInterceptor } from '@org/feature-auth';

function initAuth(authService: AuthService, authStore: InstanceType<typeof AuthStore>) {
  return async () => {
    const token = localStorage.getItem('triphub_token');
    if (!token) return;
    try {
      const user = await firstValueFrom(authService.getCurrentUser());
      authStore.setUser(user);
    } catch {
      localStorage.removeItem('triphub_token');
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      deps: [AuthService, AuthStore],
      multi: true,
    },
  ],
};
