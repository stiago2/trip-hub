import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TripMember } from '@org/util-types';

const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class TripMembersApiService {
  private readonly http = inject(HttpClient);

  getMembers(tripId: string): Observable<TripMember[]> {
    return this.http.get<TripMember[]>(`${API}/trips/${tripId}/members`);
  }
}
