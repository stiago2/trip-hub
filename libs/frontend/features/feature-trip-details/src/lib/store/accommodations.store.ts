import { computed, effect, inject } from '@angular/core';
import { signalStore, withComputed, withHooks, withMethods, withState, patchState } from '@ngrx/signals';
import { AccommodationApiService, Accommodation, CreateAccommodationPayload, UpdateAccommodationPayload, TripStore } from '@org/data-access-trips';

function nights(item: Accommodation): number {
  if (!item.checkIn || !item.checkOut) return 0;
  const diff = new Date(item.checkOut).getTime() - new Date(item.checkIn).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export const AccommodationsStore = signalStore(
  { providedIn: 'root' },
  withState({
    items: [] as Accommodation[],
    loading: false,
  }),
  withComputed(({ items }) => ({
    grandTotal: computed(() =>
      items().reduce((sum, i) => sum + (i.price != null ? Number(i.price) : 0), 0),
    ),
    totalNights: computed(() =>
      items().reduce((sum, i) => sum + nights(i), 0),
    ),
  })),
  withMethods((store) => {
    const api = inject(AccommodationApiService);
    const tripStore = inject(TripStore);

    return {
      loadAccommodations(): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        patchState(store, { loading: true });
        api.getAccommodationsByTrip(tripId).subscribe({
          next: (items) => patchState(store, { items, loading: false }),
          error: () => patchState(store, { loading: false }),
        });
      },

      createAccommodation(
        destinationId: string,
        payload: CreateAccommodationPayload,
        onSuccess?: () => void,
      ): void {
        api.createAccommodation(destinationId, payload).subscribe({
          next: (created) => {
            patchState(store, { items: [...store.items(), created] });
            onSuccess?.();
          },
          error: (err) => console.error('[AccommodationsStore] createAccommodation failed:', err),
        });
      },

      updateAccommodation(
        id: string,
        payload: UpdateAccommodationPayload,
        onSuccess?: () => void,
      ): void {
        api.updateAccommodation(id, payload).subscribe({
          next: (updated) => {
            patchState(store, { items: store.items().map((i) => (i.id === id ? updated : i)) });
            onSuccess?.();
          },
          error: (err) => console.error('[AccommodationsStore] updateAccommodation failed:', err),
        });
      },

      removeItem(id: string): void {
        api.deleteAccommodation(id).subscribe({
          next: () => patchState(store, { items: store.items().filter((i) => i.id !== id) }),
          error: (err) => console.error('[AccommodationsStore] removeItem failed:', err),
        });
      },
    };
  }),
  withHooks({
    onInit(store) {
      const tripStore = inject(TripStore);
      effect(() => {
        const tripId = tripStore.activeTripId();
        if (tripId) store.loadAccommodations();
      });
    },
  }),
);
