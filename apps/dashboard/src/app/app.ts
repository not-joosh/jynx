import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  protected title = 'Jynx Dashboard';
}
