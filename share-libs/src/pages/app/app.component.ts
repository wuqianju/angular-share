import { Component } from '@angular/core';
@Component({
  selector: 'app-main',
  template: `<router-outlet></router-outlet>`,
  styles: [
    `:host{width:100%;height:100%}`
  ]
})
export class AppMainComponent {}