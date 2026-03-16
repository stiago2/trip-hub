import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transport, CreateTransportPayload, TransportType } from '@org/util-types';

const API = '/api';

export type { Transport, CreateTransportPayload, TransportType };

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
