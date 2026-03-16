import { computed, effect, inject } from '@angular/core';
import { signalStore, withComputed, withHooks, withMethods, withState, patchState } from '@ngrx/signals';
import { BudgetItem } from '@org/util-types';
import { BudgetApiService, CreateBudgetItemPayload, TripStore } from '@org/data-access-trips';
import { ToastService } from '@org/ui-components';

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
    const toast = inject(ToastService);

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
          error: () => toast.error('Failed to add expense. Please try again.'),
        });
      },

      deleteItem(id: string): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        api.deleteItem(tripId, id).subscribe({
          next: () => patchState(store, { items: store.items().filter((i) => i.id !== id) }),
          error: () => toast.error('Failed to delete expense. Please try again.'),
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
