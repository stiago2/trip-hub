import { Component } from '@angular/core';

@Component({
  selector: 'lib-budget-tab',
  standalone: true,
  template: `
    <div class="tab-content">
      <h2>Budget</h2>
      <p>Budget items will appear here.</p>
    </div>
  `,
  styles: [`
    .tab-content { padding: 16px 0; }
  `],
})
export class BudgetTabComponent {}
