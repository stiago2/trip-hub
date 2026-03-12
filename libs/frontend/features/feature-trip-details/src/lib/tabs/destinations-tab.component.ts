import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DestinationsStore } from '@org/data-access';

@Component({
  selector: 'lib-destinations-tab',
  standalone: true,
  template: `
    <div class="tab-content">
      @if (store.loading()) {
        <p>Loading...</p>
      } @else if (store.destinations().length === 0) {
        <p>No destinations yet.</p>
      } @else {
        <ul class="destinations-list">
          @for (destination of store.destinations(); track destination.id) {
            <li class="destination-item">
              {{ destination.name }} - {{ destination.country }}
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .tab-content { padding: 16px 0; }
    .destinations-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .destination-item { padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; }
  `],
})
export class DestinationsTabComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(DestinationsStore);

  ngOnInit(): void {
    const tripId = this.route.snapshot.paramMap.get('tripId') ?? '';
    this.store.loadDestinations(tripId);
  }
}
