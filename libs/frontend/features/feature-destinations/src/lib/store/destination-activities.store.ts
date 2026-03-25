import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { DestinationActivity } from '@org/util-types';
import { CreateActivityPayload, DestinationActivitiesApiService } from '@org/data-access-trips';
import { ToastService } from '@org/ui-components';

export const DestinationActivitiesStore = signalStore(
  { providedIn: 'root' },
  withState({
    activitiesByDestination: {} as Record<string, DestinationActivity[]>,
    loadingIds: [] as string[],
  }),
  withMethods((store) => {
    const api = inject(DestinationActivitiesApiService);
    const toast = inject(ToastService);

    return {
      loadActivities(destinationId: string): void {
        if (store.activitiesByDestination()[destinationId]) return;
        patchState(store, { loadingIds: [...store.loadingIds(), destinationId] });
        api.getActivities(destinationId).subscribe({
          next: (activities) =>
            patchState(store, {
              activitiesByDestination: { ...store.activitiesByDestination(), [destinationId]: activities },
              loadingIds: store.loadingIds().filter((id) => id !== destinationId),
            }),
          error: () =>
            patchState(store, { loadingIds: store.loadingIds().filter((id) => id !== destinationId) }),
        });
      },

      createActivity(destinationId: string, payload: CreateActivityPayload, onSuccess?: () => void): void {
        api.createActivity(destinationId, payload).subscribe({
          next: (activity) => {
            const current = store.activitiesByDestination()[destinationId] ?? [];
            patchState(store, {
              activitiesByDestination: {
                ...store.activitiesByDestination(),
                [destinationId]: [...current, activity],
              },
            });
            onSuccess?.();
          },
          error: () => toast.error('Failed to add activity.'),
        });
      },

      toggleDone(destinationId: string, activityId: string): void {
        api.toggleDone(activityId).subscribe({
          next: (updated) => {
            const current = store.activitiesByDestination()[destinationId] ?? [];
            patchState(store, {
              activitiesByDestination: {
                ...store.activitiesByDestination(),
                [destinationId]: current.map((a) => (a.id === activityId ? updated : a)),
              },
            });
          },
          error: () => toast.error('Failed to update activity.'),
        });
      },

      deleteActivity(destinationId: string, activityId: string): void {
        api.deleteActivity(activityId).subscribe({
          next: () => {
            const current = store.activitiesByDestination()[destinationId] ?? [];
            patchState(store, {
              activitiesByDestination: {
                ...store.activitiesByDestination(),
                [destinationId]: current.filter((a) => a.id !== activityId),
              },
            });
          },
          error: () => toast.error('Failed to delete activity.'),
        });
      },
    };
  }),
);
