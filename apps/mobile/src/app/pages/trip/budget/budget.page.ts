import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonFab, IonFabButton, IonIcon, IonSpinner, IonSkeletonText,
  IonModal, IonButton, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, cashOutline, trashOutline } from 'ionicons/icons';
import { TripStore, BudgetApiService } from '@org/data-access-trips';
import { BudgetItem, CreateBudgetItemPayload } from '@org/util-types';

const CATEGORIES = ['Accommodation', 'Transport', 'Food', 'Activities', 'Shopping', 'Other'];

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [
    CurrencyPipe, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonFab, IonFabButton, IonIcon, IonSpinner, IonSkeletonText,
    IonModal, IonButton, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>Budget</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (loading()) {
        <div class="list-wrap">
          @for (i of [1,2,3]; track i) {
            <ion-skeleton-text animated style="height:64px;border-radius:14px;margin-bottom:10px"></ion-skeleton-text>
          }
        </div>
      } @else {
        <!-- Summary card -->
        <div class="summary-card">
          <div class="summary-label">Total Spent</div>
          <div class="summary-amount">{{ total() | currency }}</div>
        </div>

        @if (items().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><ion-icon name="cash-outline"></ion-icon></div>
            <h3>No budget items yet</h3>
            <p>Tap + to track your first expense</p>
          </div>
        } @else {
          <div class="list-wrap">
            @for (item of items(); track item.id) {
              <div class="budget-item">
                <div class="item-info">
                  <div class="item-title">{{ item.title }}</div>
                  <div class="item-category">{{ item.category }}</div>
                </div>
                <div class="item-right">
                  <div class="item-amount">{{ +item.amount | currency }}</div>
                  <button class="delete-btn" (click)="deleteItem(item)">
                    <ion-icon name="trash-outline"></ion-icon>
                  </button>
                </div>
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

    <!-- Add item modal -->
    <ion-modal [isOpen]="modalOpen()" (didDismiss)="closeModal()">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button (click)="closeModal()">Cancel</ion-button>
            </ion-buttons>
            <ion-title>Add Expense</ion-title>
            <ion-buttons slot="end">
              <ion-button [strong]="true" [disabled]="!canSave() || saving()" (click)="save()">
                @if (saving()) { <ion-spinner name="crescent" style="width:18px;height:18px"></ion-spinner> }
                @else { Save }
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="form-card">
            <ion-item lines="none">
              <ion-label position="stacked">Description <span class="req">*</span></ion-label>
              <ion-input [(ngModel)]="form.title" placeholder="e.g. Hotel booking" autocapitalize="sentences"></ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Amount (USD) <span class="req">*</span></ion-label>
              <ion-input [(ngModel)]="form.amount" type="number" placeholder="0.00" min="0"></ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="stacked">Category</ion-label>
              <ion-select [(ngModel)]="form.category" interface="action-sheet">
                @for (cat of categories; track cat) {
                  <ion-select-option [value]="cat">{{ cat }}</ion-select-option>
                }
              </ion-select>
            </ion-item>
          </div>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .summary-card {
      margin: 16px; padding: 20px 24px; border-radius: 16px;
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: white;
    }
    .summary-label { font-size: 0.78rem; opacity: 0.75; margin-bottom: 4px; }
    .summary-amount { font-size: 2rem; font-weight: 800; }

    .list-wrap { padding: 0 16px 100px; }

    .budget-item {
      display: flex; align-items: center; justify-content: space-between;
      background: #fff; border-radius: 14px; padding: 14px 16px;
      margin-bottom: 10px; box-shadow: 0 1px 8px rgba(15,23,42,0.06);
    }
    .item-title { font-size: 0.95rem; font-weight: 600; color: #0f172a; }
    .item-category { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
    .item-right { display: flex; align-items: center; gap: 12px; }
    .item-amount { font-size: 1rem; font-weight: 700; color: #2563eb; }
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
export class BudgetPage {
  private readonly tripStore = inject(TripStore);
  private readonly api = inject(BudgetApiService);

  readonly items = signal<BudgetItem[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);
  readonly categories = CATEGORIES;

  form: CreateBudgetItemPayload = { title: '', amount: 0, category: 'Other' };

  readonly total = computed(() =>
    this.items().reduce((sum, i) => sum + Number(i.amount), 0)
  );

  canSave(): boolean {
    return this.form.title.trim().length > 0 && this.form.amount > 0;
  }

  constructor() {
    addIcons({ addOutline, cashOutline, trashOutline });
    this.load();
  }

  private load(): void {
    const id = this.tripStore.activeTripId();
    if (!id) return;
    this.loading.set(true);
    this.api.getBudget(id).subscribe({
      next: (items) => { this.items.set(items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openModal(): void {
    this.form = { title: '', amount: 0, category: 'Other' };
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  save(): void {
    const id = this.tripStore.activeTripId();
    if (!id || !this.canSave()) return;
    this.saving.set(true);
    this.api.createItem(id, this.form).subscribe({
      next: (item) => {
        this.items.update((list) => [...list, item]);
        this.saving.set(false);
        this.closeModal();
      },
      error: () => this.saving.set(false),
    });
  }

  deleteItem(item: BudgetItem): void {
    const id = this.tripStore.activeTripId();
    if (!id) return;
    this.api.deleteItem(id, item.id).subscribe({
      next: () => this.items.update((list) => list.filter((i) => i.id !== item.id)),
    });
  }
}
