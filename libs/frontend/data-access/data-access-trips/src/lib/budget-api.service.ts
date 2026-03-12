import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BudgetItem } from '@org/util-types';

const API = 'http://localhost:3000/api';

export interface CreateBudgetItemPayload {
  title: string;
  amount: number;
  category: string;
  paidByUserId?: string;
}

@Injectable({ providedIn: 'root' })
export class BudgetApiService {
  private readonly http = inject(HttpClient);

  getBudget(tripId: string): Observable<BudgetItem[]> {
    return this.http.get<BudgetItem[]>(`${API}/trips/${tripId}/budget`);
  }

  createItem(tripId: string, payload: CreateBudgetItemPayload): Observable<BudgetItem> {
    return this.http.post<BudgetItem>(`${API}/trips/${tripId}/budget`, payload);
  }

  deleteItem(tripId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${API}/trips/${tripId}/budget/${id}`);
  }
}
