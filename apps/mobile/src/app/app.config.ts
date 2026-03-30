import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
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
    provideIonicAngular({ mode: 'ios' }),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      deps: [AuthService, AuthStore],
      multi: true,
    },
  ],
};
