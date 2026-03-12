import { effect, inject } from '@angular/core';
import { signalStore, withHooks, withMethods, withState, patchState } from '@ngrx/signals';
import { CreateTransportPayload, Transport, TransportApiService, TripStore } from '@org/data-access-trips';

export const TransportStore = signalStore(
  { providedIn: 'root' },
  withState({
    transports: [] as Transport[],
    loading: false,
  }),
  withMethods((store) => {
    const api = inject(TransportApiService);
    const tripStore = inject(TripStore);

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

      createTransport(payload: CreateTransportPayload, onSuccess?: () => void): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        api.createTransport(tripId, payload).subscribe({
          next: (item) => {
            patchState(store, { transports: [...store.transports(), item] });
            onSuccess?.();
          },
          error: (err) => console.error('[TransportStore] createTransport failed:', err),
        });
      },

      deleteTransport(id: string): void {
        api.deleteTransport(id).subscribe({
          next: () => patchState(store, { transports: store.transports().filter((t) => t.id !== id) }),
          error: (err) => console.error('[TransportStore] deleteTransport failed:', err),
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
