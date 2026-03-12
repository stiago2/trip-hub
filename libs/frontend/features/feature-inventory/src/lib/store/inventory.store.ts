import { computed, effect, inject } from '@angular/core';
import { signalStore, withComputed, withHooks, withMethods, withState, patchState } from '@ngrx/signals';
import { InventoryItem } from '@org/util-types';
import { CreateInventoryItemPayload, InventoryApiService, TripStore } from '@org/data-access-trips';

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

      createItem(payload: CreateInventoryItemPayload, onSuccess?: () => void): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        api.createItem(tripId, payload).subscribe({
          next: (item) => {
            patchState(store, { items: [...store.items(), item] });
            onSuccess?.();
          },
          error: (err) => console.error('[InventoryStore] createItem failed:', err),
        });
      },

      togglePacked(item: InventoryItem): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        api.togglePacked(tripId, item.id).subscribe({
          next: (updated) =>
            patchState(store, { items: store.items().map((i) => (i.id === updated.id ? updated : i)) }),
          error: (err) => console.error('[InventoryStore] togglePacked failed:', err),
        });
      },

      deleteItem(id: string): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        api.deleteItem(tripId, id).subscribe({
          next: () => patchState(store, { items: store.items().filter((i) => i.id !== id) }),
          error: (err) => console.error('[InventoryStore] deleteItem failed:', err),
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
