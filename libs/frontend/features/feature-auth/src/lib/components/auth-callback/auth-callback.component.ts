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
    } else {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
