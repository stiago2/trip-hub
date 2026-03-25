import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivityItem } from '@org/util-types';

const API = '/api';

export type { ActivityItem };

export interface ActivityPageResult {
  items: ActivityItem[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ActivityApiService {
  private readonly http = inject(HttpClient);

  getActivityByTrip(tripId: string, limit = 10, offset = 0): Observable<ActivityPageResult> {
    return this.http.get<ActivityPageResult>(`${API}/trips/${tripId}/activity?limit=${limit}&offset=${offset}`);
  }
}
