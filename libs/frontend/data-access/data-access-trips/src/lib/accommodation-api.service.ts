import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Accommodation, CreateAccommodationPayload, UpdateAccommodationPayload } from '@org/util-types';

const API = '/api';

export type { Accommodation, CreateAccommodationPayload, UpdateAccommodationPayload };

@Injectable({ providedIn: 'root' })
export class AccommodationApiService {
  private readonly http = inject(HttpClient);

  getAccommodationsByTrip(tripId: string): Observable<Accommodation[]> {
    return this.http.get<Accommodation[]>(`${API}/trips/${tripId}/accommodations`);
  }

  createAccommodation(destinationId: string, payload: CreateAccommodationPayload): Observable<Accommodation> {
    return this.http.post<Accommodation>(`${API}/destinations/${destinationId}/accommodations`, payload);
  }

  updateAccommodation(id: string, payload: UpdateAccommodationPayload): Observable<Accommodation> {
    return this.http.put<Accommodation>(`${API}/accommodations/${id}`, payload);
  }

  deleteAccommodation(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/accommodations/${id}`);
  }
}
