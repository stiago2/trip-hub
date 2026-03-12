import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invitation, TripMember } from '@org/util-types';

const API = 'http://localhost:3000/api';

export interface InviteUserPayload {
  email: string;
  role: 'EDITOR' | 'VIEWER';
}

@Injectable({ providedIn: 'root' })
export class InvitationsApiService {
  private readonly http = inject(HttpClient);

  getTripInvitations(tripId: string): Observable<Invitation[]> {
    return this.http.get<Invitation[]>(`${API}/trips/${tripId}/invitations`);
  }

  inviteUser(tripId: string, payload: InviteUserPayload): Observable<Invitation> {
    return this.http.post<Invitation>(`${API}/trips/${tripId}/invitations`, payload);
  }

  acceptInvitation(invitationId: string): Observable<TripMember> {
    return this.http.patch<TripMember>(`${API}/invitations/${invitationId}/accept`, {});
  }

  declineInvitation(invitationId: string): Observable<Invitation> {
    return this.http.patch<Invitation>(`${API}/invitations/${invitationId}/decline`, {});
  }
}
