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

      <lib-trip-dashboard-header [members]="members()" />

      <lib-trip-stats-row
        [tripId]="tripId"
        [destinationCount]="destinationCount()"
        [totalBudget]="totalBudget()"
        [packedCount]="packedCount()"
        [totalItems]="totalItems()"
        [memberCount]="members().length"
      />

      <div class="import-bar">
        <button class="import-btn" (click)="showImportModal.set(true)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          Import Travel Document
        </button>
      </div>

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

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 1100px) {
      .dashboard-grid { grid-template-columns: 1fr 300px; }
    }
    @media (max-width: 860px) {
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

    .import-bar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }

    .import-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 8px 16px; border-radius: 10px;
      background: white; border: 1.5px solid #e2e8f0;
      font-size: 0.85rem; font-weight: 600; color: #475569;
      cursor: pointer; transition: all 0.15s;
    }
    .import-btn:hover {
      border-color: #6366f1; color: #6366f1;
      background: #f5f3ff;
    }
    .import-btn svg { color: currentColor; }
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
