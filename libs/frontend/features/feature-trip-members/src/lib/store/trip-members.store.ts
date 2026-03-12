import { effect, inject } from '@angular/core';
import { signalStore, withHooks, withMethods, withState, patchState } from '@ngrx/signals';
import { Invitation, TripMember } from '@org/util-types';
import { InvitationsApiService, InviteUserPayload, TripStore } from '@org/data-access-trips';
import { TripMembersApiService } from '../services/trip-members-api.service';

export const TripMembersStore = signalStore(
  { providedIn: 'root' },
  withState({
    members: [] as TripMember[],
    invitations: [] as Invitation[],
    loading: false,
  }),
  withMethods((store) => {
    const membersApi = inject(TripMembersApiService);
    const invitationsApi = inject(InvitationsApiService);
    const tripStore = inject(TripStore);

    return {
      load(): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        patchState(store, { loading: true });

        membersApi.getMembers(tripId).subscribe({
          next: (members) => patchState(store, { members, loading: false }),
          error: () => patchState(store, { loading: false }),
        });

        invitationsApi.getTripInvitations(tripId).subscribe({
          next: (invitations) => patchState(store, { invitations }),
          error: (err) => console.error('[TripMembersStore] loadInvitations failed:', err),
        });
      },

      inviteUser(payload: InviteUserPayload, onSuccess?: () => void): void {
        const tripId = tripStore.activeTripId();
        if (!tripId) return;
        invitationsApi.inviteUser(tripId, payload).subscribe({
          next: (invitation) => {
            patchState(store, { invitations: [invitation, ...store.invitations()] });
            onSuccess?.();
          },
          error: (err) => console.error('[TripMembersStore] inviteUser failed:', err),
        });
      },

      acceptInvitation(invitationId: string): void {
        invitationsApi.acceptInvitation(invitationId).subscribe({
          next: () => {
            patchState(store, {
              invitations: store.invitations().map((i) =>
                i.id === invitationId ? { ...i, status: 'ACCEPTED' as const } : i,
              ),
            });
            const tripId = tripStore.activeTripId();
            if (tripId) {
              membersApi.getMembers(tripId).subscribe({
                next: (members) => patchState(store, { members }),
              });
            }
          },
          error: (err) => console.error('[TripMembersStore] acceptInvitation failed:', err),
        });
      },

      declineInvitation(invitationId: string): void {
        invitationsApi.declineInvitation(invitationId).subscribe({
          next: () =>
            patchState(store, {
              invitations: store.invitations().map((i) =>
                i.id === invitationId ? { ...i, status: 'DECLINED' as const } : i,
              ),
            }),
          error: (err) => console.error('[TripMembersStore] declineInvitation failed:', err),
        });
      },
    };
  }),
  withHooks({
    onInit(store) {
      const tripStore = inject(TripStore);
      effect(() => {
        const tripId = tripStore.activeTripId();
        if (tripId) store.load();
      });
    },
  }),
);
