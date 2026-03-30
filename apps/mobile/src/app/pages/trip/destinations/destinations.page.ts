import { Component } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mapOutline } from 'ionicons/icons';

@Component({
  selector: 'app-destinations',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonIcon],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>Destinations</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="coming-soon">
        <div class="icon-wrap"><ion-icon name="map-outline"></ion-icon></div>
        <h3>Destinations</h3>
        <p>Coming in the next phase</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .coming-soon {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 60vh; gap: 12px; text-align: center; padding: 32px;
    }
    .icon-wrap {
      width: 72px; height: 72px; border-radius: 20px; background: #eff6ff;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; color: #2563eb;
    }
    h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    p  { margin: 0; font-size: 0.9rem; color: #94a3b8; }
  `],
})
export class DestinationsPage {
  constructor() { addIcons({ mapOutline }); }
}
