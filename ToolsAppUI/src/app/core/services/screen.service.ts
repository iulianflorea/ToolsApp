import { Injectable, signal, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';

@Injectable({ providedIn: 'root' })
export class ScreenService {
  readonly isMobile = signal(false);

  constructor() {
    inject(BreakpointObserver)
      .observe('(max-width: 768px)')
      .subscribe(state => this.isMobile.set(state.matches));
  }
}
