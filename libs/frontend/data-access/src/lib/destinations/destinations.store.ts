import { inject, Injectable, signal } from '@angular/core';
import { Destination, DestinationsApiService } from '../api/destinations/destinations-api.service';

@Injectable({ providedIn: 'root' })
export class DestinationsStore {
  private readonly api = inject(DestinationsApiService);

  private readonly _destinations = signal<Destination[]>([]);
  private readonly _loading = signal(false);

  readonly destinations = this._destinations.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadDestinations(tripId: string): void {
    this._loading.set(true);
    this.api.getDestinations(tripId).subscribe({
      next: (data) => {
        this._destinations.set(data);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }
}
