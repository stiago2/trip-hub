import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = '/api';

export type TransportType = 'FLIGHT' | 'TRAIN' | 'BUS' | 'CAR';

export interface Transport {
  id: string;
  tripId: string;
  type: TransportType;
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  arrivalTime: string;
  price: number | null;
}

export interface CreateTransportPayload {
  type: TransportType;
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  arrivalTime: string;
  price?: number;
}

@Injectable({ providedIn: 'root' })
export class TransportApiService {
  private readonly http = inject(HttpClient);

  getTransports(tripId: string): Observable<Transport[]> {
    return this.http.get<Transport[]>(`${API}/trips/${tripId}/transport`);
  }

  createTransport(tripId: string, payload: CreateTransportPayload): Observable<Transport> {
    return this.http.post<Transport>(`${API}/trips/${tripId}/transport`, payload);
  }

  deleteTransport(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/transport/${id}`);
  }
}
