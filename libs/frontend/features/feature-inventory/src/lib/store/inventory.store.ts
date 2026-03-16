import { computed, effect, inject } from '@angular/core';
import { signalStore, withComputed, withHooks, withMethods, withState, patchState } from '@ngrx/signals';
import { InventoryItem } from '@org/util-types';
import { CreateInventoryItemPayload, InventoryApiService, TripStore } from '@org/data-access-trips';
import { ToastService } from '@org/ui-components';

const CATEGORIES: InventoryItem['category'][] = [
  'CLOTHING',
  'TECH',
  'TOILETRIES',
  'DOCUMENTS',
  'OTHER',
];

export const InventoryStore = signalStore(
  { providedIn: 'root' },
  withState({
    items: [] as InventoryItem[],
    loading: false,
  }),
  withComputed(({ items }) => ({
    itemsByCategory: computed(() =>
      CATEGORIES.map((cat) => ({
        category: cat,
        items: items().filter((i) => i.category === cat),
      })).filter((g) => g.items.length > 0),
    ),
  })),
  withMethods((store) => {
    const api = inject(InventoryApiService);
    const tripStore = inject(TripStore);
    const toast = inject(ToastService);

    return {
      loadInventory(): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        patchState(store, { loading: true });
        api.getInventory(tripId).subscribe({
          next: (items) => patchState(store, { items, loading: false }),
          error: () => patchState(store, { loading: false }),
        });
      },

      createItem(payload: CreateInventoryItemPayload, onSuccess?: () => void, onError?: () => void): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        api.createItem(tripId, payload).subscribe({
          next: (item) => {
            patchState(store, { items: [...store.items(), item] });
            onSuccess?.();
          },
          error: () => { toast.error('Failed to add item. Please try again.'); onError?.(); },
        });
      },

      togglePacked(item: InventoryItem): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        api.togglePacked(tripId, item.id).subscribe({
          next: (updated) =>
            patchState(store, { items: store.items().map((i) => (i.id === updated.id ? updated : i)) }),
          error: () => toast.error('Failed to update item. Please try again.'),
        });
      },

      deleteItem(id: string): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        api.deleteItem(tripId, id).subscribe({
          next: () => patchState(store, { items: store.items().filter((i) => i.id !== id) }),
          error: () => toast.error('Failed to delete item. Please try again.'),
        });
      },
    };
  }),
  withHooks({
    onInit(store) {
      const tripStore = inject(TripStore);
      effect(() => {
        const tripId = tripStore.activeTripId();
        if (tripId) store.loadInventory();
      });
    },
  }),
);
