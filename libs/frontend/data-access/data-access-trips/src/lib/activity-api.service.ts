import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
}

@Injectable({ providedIn: 'root' })
export class ActivityApiService {
  constructor(private readonly http: HttpClient) {}

  getActivityByTrip(tripId: string, limit = 10): Observable<ActivityItem[]> {
    return this.http.get<ActivityItem[]>(`/api/trips/${tripId}/activity?limit=${limit}`);
  }
}
