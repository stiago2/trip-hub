import { inject } from '@angular/core';
import { signalStore, withMethods, withState, patchState } from '@ngrx/signals';
import { Trip } from '@org/util-types';
import { TripsApiService } from '@org/data-access-trips';

export const TripDetailsStore = signalStore(
  { providedIn: 'root' },
  withState({
    trip: null as Trip | null,
    loading: false,
  }),
  withMethods((store) => {
    const api = inject(TripsApiService);

    return {
      loadTrip(tripId: string): void {
        patchState(store, { loading: true });
        api.getTrip(tripId).subscribe({
          next: (trip) => patchState(store, { trip, loading: false }),
          error: () => patchState(store, { loading: false }),
        });
      },
    };
  }),
);
