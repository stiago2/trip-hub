import { computed, effect, inject } from '@angular/core';
import { signalStore, withComputed, withHooks, withMethods, withState, patchState } from '@ngrx/signals';
import { BudgetItem } from '@org/util-types';
import { BudgetApiService, CreateBudgetItemPayload, TripStore } from '@org/data-access-trips';

export const BudgetStore = signalStore(
  { providedIn: 'root' },
  withState({
    items: [] as BudgetItem[],
    loading: false,
  }),
  withComputed(({ items }) => ({
    totalBudget: computed(() =>
      items().reduce((sum, item) => sum + parseFloat(item.amount), 0),
    ),
  })),
  withMethods((store) => {
    const api = inject(BudgetApiService);
    const tripStore = inject(TripStore);

    return {
      loadBudget(): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        patchState(store, { loading: true });
        api.getBudget(tripId).subscribe({
          next: (items) => patchState(store, { items, loading: false }),
          error: () => patchState(store, { loading: false }),
        });
      },

      createItem(payload: CreateBudgetItemPayload, onSuccess?: () => void): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        api.createItem(tripId, payload).subscribe({
          next: (item) => {
            patchState(store, { items: [...store.items(), item] });
            onSuccess?.();
          },
          error: (err) => console.error('[BudgetStore] createItem failed:', err),
        });
      },

      deleteItem(id: string): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        api.deleteItem(tripId, id).subscribe({
          next: () => patchState(store, { items: store.items().filter((i) => i.id !== id) }),
          error: (err) => console.error('[BudgetStore] deleteItem failed:', err),
        });
      },
    };
  }),
  withHooks({
    onInit(store) {
      const tripStore = inject(TripStore);
      effect(() => {
        const tripId = tripStore.activeTripId();
        if (tripId) store.loadBudget();
      });
    },
  }),
);
