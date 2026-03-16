import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivityItem } from '@org/util-types';

const API = '/api';

export type { ActivityItem };

@Injectable({ providedIn: 'root' })
export class ActivityApiService {
  private readonly http = inject(HttpClient);

  getActivityByTrip(tripId: string, limit = 10): Observable<ActivityItem[]> {
    return this.http.get<ActivityItem[]>(`${API}/trips/${tripId}/activity?limit=${limit}`);
  }
}
