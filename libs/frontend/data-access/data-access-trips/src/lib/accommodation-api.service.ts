import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api';

export interface Accommodation {
  id: string;
  tripId: string;
  destinationId: string;
  name: string;
  checkIn: string;
  checkOut: string;
  address: string | null;
  price: number | null;
}

export interface CreateAccommodationPayload {
  name: string;
  checkIn: string;
  checkOut: string;
  address?: string;
  price?: number;
}

@Injectable({ providedIn: 'root' })
export class AccommodationApiService {
  private readonly http = inject(HttpClient);

  getAccommodationsByTrip(tripId: string): Observable<Accommodation[]> {
    return this.http.get<Accommodation[]>(`${API}/trips/${tripId}/accommodations`);
  }

  createAccommodation(destinationId: string, payload: CreateAccommodationPayload): Observable<Accommodation> {
    return this.http.post<Accommodation>(`${API}/destinations/${destinationId}/accommodations`, payload);
  }

  deleteAccommodation(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/accommodations/${id}`);
  }
}
