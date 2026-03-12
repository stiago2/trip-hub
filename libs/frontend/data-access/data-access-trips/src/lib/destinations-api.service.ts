import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Destination } from '@org/util-types';

const API = '/api';

export interface CreateDestinationPayload {
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface UpdateDestinationPayload {
  country?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class DestinationsApiService {
  private readonly http = inject(HttpClient);

  getDestinations(tripId: string): Observable<Destination[]> {
    return this.http.get<Destination[]>(`${API}/trips/${tripId}/destinations`);
  }

  createDestination(tripId: string, payload: CreateDestinationPayload): Observable<Destination> {
    return this.http.post<Destination>(`${API}/trips/${tripId}/destinations`, payload);
  }

  updateDestination(id: string, payload: UpdateDestinationPayload): Observable<Destination> {
    return this.http.put<Destination>(`${API}/destinations/${id}`, payload);
  }

  deleteDestination(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/destinations/${id}`);
  }
}
