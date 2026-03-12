import { inject } from '@angular/core';
import { signalStore, withMethods, withState, patchState } from '@ngrx/signals';
import { Trip } from '@org/util-types';
import { TripsApiService } from './trips-api.service';

export const TripStore = signalStore(
  { providedIn: 'root' },
  withState({
    activeTripId: null as string | null,
    trip: null as Trip | null,
    loading: false,
  }),
  withMethods((store) => {
    const api = inject(TripsApiService);

    return {
      setActiveTrip(tripId: string): void {
        patchState(store, { activeTripId: tripId, trip: null, loading: true });
        api.getTrip(tripId).subscribe({
          next: (trip) => patchState(store, { trip, loading: false }),
          error: () => patchState(store, { loading: false }),
        });
      },

      loadTrip(tripId: string): void {
        patchState(store, { activeTripId: tripId, loading: true });
        api.getTrip(tripId).subscribe({
          next: (trip) => patchState(store, { trip, loading: false }),
          error: () => patchState(store, { loading: false }),
        });
      },

      updateTrip(partial: Partial<Trip>): void {
        const current = store.trip();
        if (current) {
          patchState(store, { trip: { ...current, ...partial } });
        }
      },
    };
  }),
);
