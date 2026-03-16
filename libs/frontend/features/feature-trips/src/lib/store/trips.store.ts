import { inject } from '@angular/core';
import { signalStore, withMethods, withState, patchState } from '@ngrx/signals';
import { Trip } from '@org/util-types';
import { TripsApiService, CreateTripPayload, UpdateTripPayload } from '@org/data-access-trips';
import { ToastService } from '@org/ui-components';

export const TripsStore = signalStore(
  { providedIn: 'root' },
  withState({
    trips: [] as Trip[],
    loading: false,
  }),
  withMethods((store) => {
    const api = inject(TripsApiService);
    const toast = inject(ToastService);

    return {
      loadTrips(): void {
        patchState(store, { loading: true });
        api.getTrips().subscribe({
          next: (trips) => patchState(store, { trips, loading: false }),
          error: () => patchState(store, { loading: false }),
        });
      },

      createTrip(payload: CreateTripPayload, onSuccess?: (trip: Trip) => void, onError?: () => void): void {
        api.createTrip(payload).subscribe({
          next: (trip) => {
            patchState(store, { trips: [...store.trips(), trip] });
            onSuccess?.(trip);
          },
          error: () => { toast.error('Failed to create trip. Please try again.'); onError?.(); },
        });
      },

      updateTrip(id: string, payload: UpdateTripPayload, onSuccess?: () => void, onError?: () => void): void {
        api.updateTrip(id, payload).subscribe({
          next: (updated) => {
            patchState(store, { trips: store.trips().map((t) => (t.id === id ? updated : t)) });
            onSuccess?.();
          },
          error: () => { toast.error('Failed to update trip. Please try again.'); onError?.(); },
        });
      },

      deleteTrip(id: string, onSuccess?: () => void): void {
        api.deleteTrip(id).subscribe({
          next: () => {
            patchState(store, { trips: store.trips().filter((t) => t.id !== id) });
            onSuccess?.();
          },
          error: () => toast.error('Failed to delete trip. Please try again.'),
        });
      },
    };
  }),
);
