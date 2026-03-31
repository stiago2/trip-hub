import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonFab, IonFabButton, IonIcon, IonSpinner, IonSkeletonText, IonCheckbox,
  IonModal, IonButton, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, bagHandleOutline, trashOutline } from 'ionicons/icons';
import { TripStore, InventoryApiService } from '@org/data-access-trips';
import { InventoryItem, InventoryCategory } from '@org/util-types';

const CATEGORIES: InventoryCategory[] = ['CLOTHING', 'TECH', 'TOILETRIES', 'DOCUMENTS', 'OTHER'];
const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  CLOTHING: 'Clothing', TECH: 'Tech', TOILETRIES: 'Toiletries',
  DOCUMENTS: 'Documents', OTHER: 'Other',
};

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonFab, IonFabButton, IonIcon, IonSpinner, IonSkeletonText, IonCheckbox,
    IonModal, IonButton, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>Packing List</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (loading()) {
        <div class="list-wrap">
          @for (i of [1,2,3,4]; track i) {
            <ion-skeleton-text animated style="height:56px;border-radius:14px;margin-bottom:8px"></ion-skeleton-text>
          }
        </div>
      } @else {
        <!-- Progress bar -->
        @if (items().length > 0) {
          <div class="progress-card">
            <div class="progress-row">
              <span class="progress-label">{{ packedCount() }} / {{ items().length }} packed</span>
              <span class="progress-pct">{{ progressPct() }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progressPct()"></div>
            </div>
          </div>
        }

        @if (items().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><ion-icon name="bag-handle-outline"></ion-icon></div>
            <h3>Packing list is empty</h3>
            <p>Tap + to add your first item</p>
          </div>
        } @else {
          <div class="list-wrap">
            @for (item of items(); track item.id) {
              <div class="pack-item" [class.packed]="item.packed">
                <ion-checkbox
                  [checked]="item.packed"
                  (ionChange)="togglePacked(item)"
                ></ion-checkbox>
                <div class="item-info">
                  <div class="item-name">{{ item.name }}</div>
                  <div class="item-meta">{{ categoryLabel(item.category) }} · qty {{ item.quantity }}</div>
                </div>
                <button class="delete-btn" (click)="deleteItem(item)">
                  <ion-icon name="trash-outline"></ion-icon>
                </button>
              </div>
            }
          </div>
        }
      }
    </ion-content>

    <ion-fab slot="fixed" vertical="bottom" horizontal="end">
      <ion-fab-button color="primary" (click)="openModal()">
        <ion-icon name="add-outline"></ion-icon>
      </ion-fab-button>
    </ion-fab>

    <ion-modal [isOpen]="modalOpen()" (didDismiss)="closeModal()">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button (click)="closeModal()">Cancel</ion-button>
            </ion-buttons>
            <ion-title>Add Item</ion-title>
            <ion-buttons slot="end">
              <ion-button [strong]="true" [disabled]="!form.name.trim() || saving()" (click)="save()">
                @if (saving()) { <ion-spinner name="crescent" style="width:18px;height:18px"></ion-spinner> }
                @else { Save }
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="form-card">
            <ion-item lines="none">
              <ion-label position="stacked">Item name <span class="req">*</span></ion-label>
              <ion-input [(ngModel)]="form.name" placeholder="e.g. Passport" autocapitalize="sentences"></ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Category</ion-label>
              <ion-select [(ngModel)]="form.category" interface="action-sheet">
                @for (cat of categories; track cat) {
                  <ion-select-option [value]="cat">{{ categoryLabel(cat) }}</ion-select-option>
                }
              </ion-select>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Quantity</ion-label>
              <ion-input [(ngModel)]="form.quantity" type="number" min="1" placeholder="1"></ion-input>
            </ion-item>
          </div>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .progress-card {
      margin: 16px; padding: 16px; border-radius: 14px; background: #fff;
      box-shadow: 0 1px 8px rgba(15,23,42,0.06);
    }
    .progress-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .progress-label { font-size: 0.85rem; font-weight: 600; color: #0f172a; }
    .progress-pct { font-size: 0.85rem; font-weight: 700; color: #2563eb; }
    .progress-bar { height: 8px; background: #e2e8f0; border-radius: 8px; overflow: hidden; }
    .progress-fill { height: 100%; background: #2563eb; border-radius: 8px; transition: width 0.3s; }

    .list-wrap { padding: 0 16px 100px; }

    .pack-item {
      display: flex; align-items: center; gap: 12px;
      background: #fff; border-radius: 14px; padding: 12px 14px;
      margin-bottom: 8px; box-shadow: 0 1px 8px rgba(15,23,42,0.06);
      transition: opacity 0.2s;
    }
    .pack-item.packed { opacity: 0.55; }
    .pack-item.packed .item-name { text-decoration: line-through; }

    .item-info { flex: 1; }
    .item-name { font-size: 0.95rem; font-weight: 600; color: #0f172a; }
    .item-meta { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
    .delete-btn {
      background: none; border: none; color: #ef4444; font-size: 1.1rem; cursor: pointer; padding: 4px;
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 80px 32px; gap: 12px; text-align: center;
    }
    .empty-icon {
      width: 72px; height: 72px; border-radius: 20px; background: #eff6ff;
      display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #2563eb;
    }
    .empty-state h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .empty-state p  { margin: 0; font-size: 0.9rem; color: #64748b; }

    .form-card {
      background: #fff; border-radius: 14px; overflow: hidden;
      box-shadow: 0 1px 8px rgba(15,23,42,0.06);
    }
    .req { color: #ef4444; }
  `],
})
export class InventoryPage {
  private readonly tripStore = inject(TripStore);
  private readonly api = inject(InventoryApiService);

  readonly items = signal<InventoryItem[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);
  readonly categories = CATEGORIES;

  form = { name: '', category: 'OTHER' as InventoryCategory, quantity: 1 };

  readonly packedCount = computed(() => this.items().filter((i) => i.packed).length);
  readonly progressPct = computed(() => {
    const total = this.items().length;
    return total === 0 ? 0 : Math.round((this.packedCount() / total) * 100);
  });

  categoryLabel(cat: InventoryCategory): string {
    return CATEGORY_LABELS[cat] ?? cat;
  }

  constructor() {
    addIcons({ addOutline, bagHandleOutline, trashOutline });
    this.load();
  }

  private load(): void {
    const id = this.tripStore.activeTripId();
    if (!id) return;
    this.loading.set(true);
    this.api.getInventory(id).subscribe({
      next: (items) => { this.items.set(items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  togglePacked(item: InventoryItem): void {
    const id = this.tripStore.activeTripId();
    if (!id) return;
    this.api.togglePacked(id, item.id).subscribe({
      next: (updated) => this.items.update((list) => list.map((i) => i.id === updated.id ? updated : i)),
    });
  }

  openModal(): void {
    this.form = { name: '', category: 'OTHER', quantity: 1 };
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  save(): void {
    const id = this.tripStore.activeTripId();
    if (!id || !this.form.name.trim()) return;
    this.saving.set(true);
    this.api.createItem(id, {
      name: this.form.name.trim(),
      category: this.form.category,
      quantity: Number(this.form.quantity) || 1,
    }).subscribe({
      next: (item) => {
        this.items.update((list) => [...list, item]);
        this.saving.set(false);
        this.closeModal();
      },
      error: () => this.saving.set(false),
    });
  }

  deleteItem(item: InventoryItem): void {
    const id = this.tripStore.activeTripId();
    if (!id) return;
    this.api.deleteItem(id, item.id).subscribe({
      next: () => this.items.update((list) => list.filter((i) => i.id !== item.id)),
    });
  }
}
