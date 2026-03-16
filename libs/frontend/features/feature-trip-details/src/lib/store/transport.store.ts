import { effect, inject } from '@angular/core';
import { signalStore, withHooks, withMethods, withState, patchState } from '@ngrx/signals';
import { CreateTransportPayload, Transport, TransportApiService, TripStore } from '@org/data-access-trips';
import { ToastService } from '@org/ui-components';

export const TransportStore = signalStore(
  { providedIn: 'root' },
  withState({
    transports: [] as Transport[],
    loading: false,
  }),
  withMethods((store) => {
    const api = inject(TransportApiService);
    const tripStore = inject(TripStore);
    const toast = inject(ToastService);

    return {
      loadTransports(): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        patchState(store, { loading: true });
        api.getTransports(tripId).subscribe({
          next: (transports) => patchState(store, { transports, loading: false }),
          error: () => patchState(store, { loading: false }),
        });
      },

      createTransport(payload: CreateTransportPayload, onSuccess?: () => void, onError?: () => void): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        api.createTransport(tripId, payload).subscribe({
          next: (item) => {
            patchState(store, { transports: [...store.transports(), item] });
            onSuccess?.();
          },
          error: () => { toast.error('Failed to add transport. Please try again.'); onError?.(); },
        });
      },

      deleteTransport(id: string): void {
        api.deleteTransport(id).subscribe({
          next: () => patchState(store, { transports: store.transports().filter((t) => t.id !== id) }),
          error: () => toast.error('Failed to delete transport. Please try again.'),
        });
      },
    };
  }),
  withHooks({
    onInit(store) {
      const tripStore = inject(TripStore);
      effect(() => {
        const tripId = tripStore.activeTripId();
        if (tripId) store.loadTransports();
      });
    },
  }),
);
