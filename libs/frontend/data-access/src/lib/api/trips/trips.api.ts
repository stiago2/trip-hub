import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface CreateTripPayload {
  title: string;
  startDate: string;
  endDate: string;
}

@Injectable({ providedIn: 'root' })
export class TripsApi {
  private http = inject(HttpClient);

  getTrips() {
    return this.http.get('/api/trips');
  }

  createTrip(payload: CreateTripPayload) {
    return this.http.post('/api/trips', payload);
  }
}
