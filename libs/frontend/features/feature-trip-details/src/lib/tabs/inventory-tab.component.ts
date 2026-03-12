import { Component } from '@angular/core';

@Component({
  selector: 'lib-inventory-tab',
  standalone: true,
  template: `
    <div class="tab-content">
      <h2>Inventory</h2>
      <p>Inventory items will appear here.</p>
    </div>
  `,
  styles: [`
    .tab-content { padding: 16px 0; }
  `],
})
export class InventoryTabComponent {}
