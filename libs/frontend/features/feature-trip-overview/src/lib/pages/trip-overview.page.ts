import { computed, Component, inject } from '@angular/core';
import { TripStore } from '@org/data-access-trips';
import { BudgetStore } from '@org/feature-budget';
import { DestinationsStore } from '@org/feature-destinations';
import { InventoryStore } from '@org/feature-inventory';
import { TripMembersStore } from '@org/feature-trip-members';
import { InventoryItem, TripMember } from '@org/util-types';
import { TripDashboardHeaderComponent } from '../components/trip-dashboard-header/trip-dashboard-header.component';
import { TripStatsRowComponent } from '../components/trip-stats-row/trip-stats-row.component';
import { NextDestinationCardComponent } from '../components/next-destination-card/next-destination-card.component';
import { UpcomingTransportPreviewComponent } from '../components/upcoming-transport-preview/upcoming-transport-preview.component';
import { AccommodationsPreviewComponent } from '../components/accommodations-preview/accommodations-preview.component';
import { InventoryPreviewComponent } from '../components/inventory-preview/inventory-preview.component';
import { ActivityFeedComponent } from '../components/activity-feed/activity-feed.component';

@Component({
  selector: 'lib-trip-overview',
  standalone: true,
  imports: [
    TripDashboardHeaderComponent,
    TripStatsRowComponent,
    NextDestinationCardComponent,
    UpcomingTransportPreviewComponent,
    AccommodationsPreviewComponent,
    InventoryPreviewComponent,
    ActivityFeedComponent,
  ],
  template: `
    <div class="dashboard">

      <lib-trip-dashboard-header [members]="members()" />

      <lib-trip-stats-row
        [tripId]="tripId"
        [destinationCount]="destinationCount()"
        [totalBudget]="totalBudget()"
        [packedCount]="packedCount()"
        [totalItems]="totalItems()"
        [memberCount]="members().length"
      />

      <div class="dashboard-grid">
        <div class="main-col">
          <lib-next-destination-card
            [destination]="firstDestination()"
            [tripId]="tripId"
          />

          <div class="preview-row">
            <lib-upcoming-transport-preview [tripId]="tripId" />
            <lib-accommodations-preview [tripId]="tripId" />
          </div>
        </div>

        <div class="sidebar-col">
          <lib-activity-feed [tripId]="tripId" />
          <lib-inventory-preview [items]="inventoryItems()" [tripId]="tripId" />
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard { padding: 4px 0 24px; }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 900px) {
      .dashboard-grid { grid-template-columns: 1fr; }
    }

    .main-col { display: flex; flex-direction: column; }

    .preview-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
    }
    @media (max-width: 600px) {
      .preview-row { grid-template-columns: 1fr; }
    }

    .sidebar-col { display: flex; flex-direction: column; gap: 16px; }
  `],
})
export class TripOverviewPage {
  private readonly tripStore = inject(TripStore);
  private readonly budgetStore = inject(BudgetStore);
  private readonly destinationsStore = inject(DestinationsStore);
  private readonly inventoryStore = inject(InventoryStore);
  private readonly membersStore = inject(TripMembersStore);

  get tripId(): string { return this.tripStore.activeTripId() ?? ''; }

  readonly members = computed((): TripMember[] => this.membersStore.members());
  readonly destinationCount = computed(() => this.destinationsStore.destinations().length);
  readonly totalBudget = computed(() => this.budgetStore.totalBudget());
  readonly inventoryItems = computed((): InventoryItem[] => this.inventoryStore.items());
  readonly totalItems = computed(() => this.inventoryStore.items().length);
  readonly packedCount = computed(() => this.inventoryStore.items().filter((i) => i.packed).length);
  readonly firstDestination = computed(() => this.destinationsStore.destinations()[0] ?? null);

}
