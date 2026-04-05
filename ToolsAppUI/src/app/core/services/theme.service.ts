import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'tt-theme';

  readonly isDark = signal<boolean>(this.resolveInitial());

  constructor() {
    // Apply theme class whenever signal changes
    effect(() => {
      document.documentElement.classList.toggle('dark', this.isDark());
    });
  }

  private resolveInitial(): boolean {
    const stored = localStorage.getItem(this.KEY);
    if (stored !== null) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  toggle(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    localStorage.setItem(this.KEY, next ? 'dark' : 'light');
  }
}
