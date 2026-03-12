import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Destination {
  id: string;
  tripId: string;
  name: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDestinationPayload {
  name: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class DestinationsApiService {
  private readonly http = inject(HttpClient);

  getDestinations(tripId: string): Observable<Destination[]> {
    return this.http.get<Destination[]>(`/api/trips/${tripId}/destinations`);
  }

  createDestination(tripId: string, payload: CreateDestinationPayload): Observable<Destination> {
    return this.http.post<Destination>(`/api/trips/${tripId}/destinations`, payload);
  }
}
