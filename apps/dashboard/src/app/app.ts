


import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule],
  selector: `app-root`,
  template: `
    <router-outlet></router-outlet>
  `,
  styleUrl: `../styles.css`,
})
export class App {
  protected title = 'dashboard';
}
