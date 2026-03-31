import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'lib-auth-callback',
  standalone: true,
  template: `<p style="padding:24px;color:#64748b">Signing in...</p>`,
})
export class AuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      // Si fue abierto como popup desde la mobile app en browser, enviar token y cerrar
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth-token', token }, '*');
        window.close();
        return;
      }

      // Intenta abrir el deep link para el APK nativo.
      // El OS intercepta triphub:// y lo enruta a la app, que captura el token.
      // En browser normal esto falla silenciosamente y cae al flujo web.
      window.location.href = `triphub://auth/callback?token=${token}`;

      // Flujo web normal (si no hay APK instalado)
      setTimeout(() => {
        this.authService.setToken(token);
        this.authService.getCurrentUser().subscribe({
          next: (user) => {
            this.authStore.setUser(user);
            this.router.navigate(['/trips'], { replaceUrl: true });
          },
          error: () => {
            this.router.navigate(['/trips'], { replaceUrl: true });
          },
        });
      }, 500);
    } else {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
