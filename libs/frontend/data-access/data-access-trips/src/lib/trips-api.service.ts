import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip } from '@org/util-types';

const API = 'http://localhost:3000/api';

export interface CreateTripPayload {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface UpdateTripPayload {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class TripsApiService {
  private readonly http = inject(HttpClient);

  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${API}/trips`);
  }

  getTrip(id: string): Observable<Trip> {
    return this.http.get<Trip>(`${API}/trips/${id}`);
  }

  createTrip(payload: CreateTripPayload): Observable<Trip> {
    return this.http.post<Trip>(`${API}/trips`, payload);
  }

  updateTrip(id: string, payload: UpdateTripPayload): Observable<Trip> {
    return this.http.put<Trip>(`${API}/trips/${id}`, payload);
  }

  deleteTrip(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/trips/${id}`);
  }
}
