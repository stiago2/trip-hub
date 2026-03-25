import { computed, effect, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { ActivityApiService, ActivityItem, TripStore } from '@org/data-access-trips';

const PAGE_SIZE = 20;

export const ActivityStore = signalStore(
  { providedIn: 'root' },
  withState({
    items: [] as ActivityItem[],
    total: 0,
    offset: 0,
    loading: false,
  }),
  withComputed((store) => ({
    hasMore: computed(() => store.items().length < store.total()),
  })),
  withMethods((store) => {
    const api = inject(ActivityApiService);
    const tripStore = inject(TripStore);

    return {
      load(): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        patchState(store, { loading: true, offset: 0 });
        api.getActivityByTrip(tripId, PAGE_SIZE, 0).subscribe({
          next: ({ items, total }) => patchState(store, { items, total, loading: false }),
          error: () => patchState(store, { loading: false }),
        });
      },

      loadMore(): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        const nextOffset = store.offset() + PAGE_SIZE;
        patchState(store, { loading: true, offset: nextOffset });
        api.getActivityByTrip(tripId, PAGE_SIZE, nextOffset).subscribe({
          next: ({ items, total }) =>
            patchState(store, { items: [...store.items(), ...items], total, loading: false }),
          error: () => patchState(store, { loading: false }),
        });
      },
    };
  }),
  withHooks({
    onInit(store) {
      const tripStore = inject(TripStore);
      effect(() => {
        if (tripStore.activeTripId()) store.load();
      });
    },
  }),
);
