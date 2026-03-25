import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DestinationActivity } from '@org/util-types';

export interface CreateActivityPayload {
  name: string;
  category: string;
  notes?: string;
}

export interface SuggestedActivity {
  name: string;
  category: string;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class DestinationActivitiesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  getActivities(destinationId: string): Observable<DestinationActivity[]> {
    return this.http.get<DestinationActivity[]>(`${this.base}/destinations/${destinationId}/activities`);
  }

  createActivity(destinationId: string, payload: CreateActivityPayload): Observable<DestinationActivity> {
    return this.http.post<DestinationActivity>(`${this.base}/destinations/${destinationId}/activities`, payload);
  }

  toggleDone(id: string): Observable<DestinationActivity> {
    return this.http.patch<DestinationActivity>(`${this.base}/destination-activities/${id}/toggle`, {});
  }

  deleteActivity(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/destination-activities/${id}`);
  }

  suggestActivities(destinationId: string): Observable<{ suggestions: SuggestedActivity[] }> {
    return this.http.post<{ suggestions: SuggestedActivity[] }>(
      `${this.base}/destinations/${destinationId}/suggest-activities`,
      {}
    );
  }
}
