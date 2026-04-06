import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIf, UpperCasePipe } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { TranslationService, Lang } from '../../core/services/translation.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

interface NavItem {
  labelKey: string;
  icon: string;
  path: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    NgIf, UpperCasePipe, TranslatePipe,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class LayoutComponent implements OnDestroy {
  private readonly auth            = inject(AuthService);
  readonly theme                   = inject(ThemeService);
  readonly ts                      = inject(TranslationService);
  private readonly bp              = inject(BreakpointObserver);
  private readonly bpSub: Subscription;

  readonly navItems: NavItem[] = [
    { labelKey: 'nav.dashboard',   icon: 'dashboard',     path: '/dashboard' },
    { labelKey: 'nav.assets',      icon: 'construction',  path: '/assets' },
    { labelKey: 'nav.locations',   icon: 'location_on',   path: '/locations' },
    { labelKey: 'nav.transfers',   icon: 'swap_horiz',    path: '/transfers' },
    { labelKey: 'nav.maintenance', icon: 'build',         path: '/maintenance' },
    { labelKey: 'nav.alerts',      icon: 'notifications', path: '/alerts' },
    { labelKey: 'nav.users',       icon: 'people',        path: '/users', adminOnly: true },
  ];

  readonly bottomNavItems: NavItem[] = [
    { labelKey: 'nav.dashboard',   icon: 'dashboard',    path: '/dashboard' },
    { labelKey: 'nav.assets',      icon: 'construction', path: '/assets' },
    { labelKey: 'nav.transfers',   icon: 'swap_horiz',   path: '/transfers' },
    { labelKey: 'nav.maintenance', icon: 'build',        path: '/maintenance' },
    { labelKey: 'nav.alerts',      icon: 'notifications',path: '/alerts' },
  ];

  readonly user    = this.auth.currentUser;
  readonly isAdmin = computed(() => this.auth.isAdmin());

  isMobile     = signal(false);
  drawerOpened = signal(true);

  readonly langs: Lang[] = ['ro', 'en', 'fr'];

  constructor() {
    this.bpSub = this.bp.observe('(max-width: 768px)').subscribe(state => {
      this.isMobile.set(state.matches);
      this.drawerOpened.set(!state.matches);
    });
  }

  ngOnDestroy(): void { this.bpSub.unsubscribe(); }

  visibleNavItems(): NavItem[] {
    return this.navItems.filter(item => !item.adminOnly || this.isAdmin());
  }

  toggleDrawer(): void { this.drawerOpened.set(!this.drawerOpened()); }

  logout(): void { this.auth.logout(); }
}
