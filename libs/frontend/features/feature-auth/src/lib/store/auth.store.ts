import { computed } from '@angular/core';
import { signalStore, withComputed, withMethods, withState, patchState } from '@ngrx/signals';
import { User } from '../services/auth.service';

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState({
    user: null as User | null,
    loading: false,
  }),
  withComputed(({ user }) => ({
    isAuthenticated: computed(() => user() !== null),
  })),
  withMethods((store) => ({
    setUser(user: User): void {
      patchState(store, { user, loading: false });
    },
    clearUser(): void {
      patchState(store, { user: null });
    },
    setLoading(loading: boolean): void {
      patchState(store, { loading });
    },
  })),
);
