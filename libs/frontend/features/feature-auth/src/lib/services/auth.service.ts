import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

const TOKEN_KEY = 'triphub_token';
const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  loginWithGoogle(): void {
    window.location.href = `${API_BASE}/auth/google`;
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${API_BASE}/auth/me`);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }
}
