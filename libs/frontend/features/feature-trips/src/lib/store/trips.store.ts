import { inject } from '@angular/core';
import { signalStore, withMethods, withState, patchState } from '@ngrx/signals';
import { Trip } from '@org/util-types';
import { TripsApiService, CreateTripPayload, UpdateTripPayload } from '@org/data-access-trips';

export const TripsStore = signalStore(
  { providedIn: 'root' },
  withState({
    trips: [] as Trip[],
    loading: false,
  }),
  withMethods((store) => {
    const api = inject(TripsApiService);

    return {
      loadTrips(): void {
        patchState(store, { loading: true });
        api.getTrips().subscribe({
          next: (trips) => patchState(store, { trips, loading: false }),
          error: () => patchState(store, { loading: false }),
        });
      },

      createTrip(payload: CreateTripPayload, onSuccess?: (trip: Trip) => void): void {
        api.createTrip(payload).subscribe({
          next: (trip) => {
            patchState(store, { trips: [...store.trips(), trip] });
            onSuccess?.(trip);
          },
          error: (err) => console.error('[TripsStore] createTrip failed:', err),
        });
      },

      updateTrip(id: string, payload: UpdateTripPayload, onSuccess?: () => void): void {
        api.updateTrip(id, payload).subscribe({
          next: (updated) => {
            patchState(store, { trips: store.trips().map((t) => (t.id === id ? updated : t)) });
            onSuccess?.();
          },
          error: (err) => console.error('[TripsStore] updateTrip failed:', err),
        });
      },
    };
  }),
);
