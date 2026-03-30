import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FlightLocation, FlightOffer } from '@org/util-types';

const API = '/api';

export type { FlightLocation, FlightOffer };

@Injectable({ providedIn: 'root' })
export class FlightSearchApiService {
  private readonly http = inject(HttpClient);

  searchLocations(query: string): Observable<FlightLocation[]> {
    return this.http.get<FlightLocation[]>(`${API}/flights/locations`, { params: { query } });
  }

  searchFlights(params: {
    fromId: string;
    toId: string;
    departDate: string;
    adults: number;
    stops?: string;
    cabinClass: string;
  }): Observable<FlightOffer[]> {
    return this.http.get<FlightOffer[]>(`${API}/flights/search`, { params: { ...params } });
  }
}
