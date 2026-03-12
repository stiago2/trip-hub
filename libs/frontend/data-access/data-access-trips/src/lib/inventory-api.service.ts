import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryItem } from '@org/util-types';

const API = '/api';

export interface CreateInventoryItemPayload {
  name: string;
  category: InventoryItem['category'];
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class InventoryApiService {
  private readonly http = inject(HttpClient);

  getInventory(tripId: string): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${API}/trips/${tripId}/inventory`);
  }

  createItem(tripId: string, payload: CreateInventoryItemPayload): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${API}/trips/${tripId}/inventory`, payload);
  }

  togglePacked(tripId: string, id: string): Observable<InventoryItem> {
    return this.http.patch<InventoryItem>(`${API}/trips/${tripId}/inventory/${id}/toggle`, {});
  }

  deleteItem(tripId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${API}/trips/${tripId}/inventory/${id}`);
  }
}
