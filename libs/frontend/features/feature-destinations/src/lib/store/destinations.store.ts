import { computed, effect, inject } from '@angular/core';
import { signalStore, withComputed, withHooks, withMethods, withState, patchState } from '@ngrx/signals';
import { Destination } from '@org/util-types';
import { CreateDestinationPayload, DestinationsApiService, TripStore, UpdateDestinationPayload } from '@org/data-access-trips';
import { ToastService } from '@org/ui-components';

export const DestinationsStore = signalStore(
  { providedIn: 'root' },
  withState({
    rawDestinations: [] as Destination[],
    loading: false,
  }),
  withComputed(({ rawDestinations }) => ({
    destinations: computed(() =>
      [...rawDestinations()].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    ),
  })),
  withMethods((store) => {
    const api = inject(DestinationsApiService);
    const tripStore = inject(TripStore);
    const toast = inject(ToastService);

    return {
      loadDestinations(): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        patchState(store, { loading: true });
        api.getDestinations(tripId).subscribe({
          next: (rawDestinations) => patchState(store, { rawDestinations, loading: false }),
          error: () => patchState(store, { loading: false }),
        });
      },

      createDestination(payload: CreateDestinationPayload, onSuccess?: () => void, onError?: () => void): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        api.createDestination(tripId, payload).subscribe({
          next: (dest) => {
            patchState(store, { rawDestinations: [...store.rawDestinations(), dest] });
            onSuccess?.();
          },
          error: () => { toast.error('Failed to add destination. Please try again.'); onError?.(); },
        });
      },

      updateDestination(id: string, payload: UpdateDestinationPayload, onSuccess?: () => void, onError?: () => void): void {
        api.updateDestination(id, payload).subscribe({
          next: (updated) => {
            patchState(store, {
              rawDestinations: store.rawDestinations().map((d) => (d.id === id ? updated : d)),
            });
            onSuccess?.();
          },
          error: () => { toast.error('Failed to update destination. Please try again.'); onError?.(); },
        });
      },

      deleteDestination(id: string): void {
        api.deleteDestination(id).subscribe({
          next: () =>
            patchState(store, { rawDestinations: store.rawDestinations().filter((d) => d.id !== id) }),
          error: () => toast.error('Failed to delete destination. Please try again.'),
        });
      },
    };
  }),
  withHooks({
    onInit(store) {
      const tripStore = inject(TripStore);
      effect(() => {
        const tripId = tripStore.activeTripId();
        if (tripId) store.loadDestinations();
      });
    },
  }),
);
