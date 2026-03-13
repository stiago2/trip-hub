import { computed, Component, inject, signal } from '@angular/core';
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
import { ImportDocumentModalComponent } from '../components/import-document-modal/import-document-modal.component';

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
    ImportDocumentModalComponent,
  ],
  template: `
    <div class="dashboard">

      <lib-trip-dashboard-header [members]="members()" (importClicked)="showImportModal.set(true)" />

      <lib-trip-stats-row
        [tripId]="tripId"
        [destinationCount]="destinationCount()"
        [totalBudget]="totalBudget()"
        [packedCount]="packedCount()"
        [totalItems]="totalItems()"
        [memberCount]="members().length"
      />

      <div class="top-row">
        <lib-next-destination-card
          [destination]="firstDestination()"
          [tripId]="tripId"
        />
        <lib-activity-feed [tripId]="tripId" />
      </div>

      <div class="bottom-row">
        <lib-upcoming-transport-preview [tripId]="tripId" />
        <lib-accommodations-preview [tripId]="tripId" />
        <lib-inventory-preview [items]="inventoryItems()" [tripId]="tripId" />
      </div>

    </div>

    @if (showImportModal()) {
      <lib-import-document-modal
        [tripId]="tripId"
        (closed)="showImportModal.set(false)"
        (imported)="showImportModal.set(false)"
      />
    }
  `,
  styles: [`
    .dashboard { padding: 4px 0 24px; }

    .top-row {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 20px;
      align-items: start;
      margin-bottom: 16px;
    }
    @media (max-width: 1100px) {
      .top-row { grid-template-columns: 1fr 300px; }
    }
    @media (max-width: 860px) {
      .top-row { grid-template-columns: 1fr; }
    }

    .bottom-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      align-items: start;
    }
    @media (max-width: 860px) {
      .bottom-row { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 560px) {
      .bottom-row { grid-template-columns: 1fr; }
    }
  `],
})
export class TripOverviewPage {
  private readonly tripStore = inject(TripStore);
  private readonly budgetStore = inject(BudgetStore);
  private readonly destinationsStore = inject(DestinationsStore);
  private readonly inventoryStore = inject(InventoryStore);
  private readonly membersStore = inject(TripMembersStore);

  get tripId(): string { return this.tripStore.activeTripId() ?? ''; }

  readonly showImportModal = signal(false);

  readonly members = computed((): TripMember[] => this.membersStore.members());
  readonly destinationCount = computed(() => this.destinationsStore.destinations().length);
  readonly totalBudget = computed(() => this.budgetStore.totalBudget());
  readonly inventoryItems = computed((): InventoryItem[] => this.inventoryStore.items());
  readonly totalItems = computed(() => this.inventoryStore.items().length);
  readonly packedCount = computed(() => this.inventoryStore.items().filter((i) => i.packed).length);
  readonly firstDestination = computed(() => this.destinationsStore.destinations()[0] ?? null);

}
