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

interface NavItem {
  label: string;
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
    NgIf, UpperCasePipe,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class LayoutComponent implements OnDestroy {
  private readonly auth            = inject(AuthService);
  readonly theme                   = inject(ThemeService);
  private readonly bp              = inject(BreakpointObserver);
  private readonly bpSub: Subscription;

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',   icon: 'dashboard',     path: '/dashboard' },
    { label: 'Assets',      icon: 'construction',  path: '/assets' },
    { label: 'Locations',   icon: 'location_on',   path: '/locations' },
    { label: 'Transfers',   icon: 'swap_horiz',    path: '/transfers' },
    { label: 'Maintenance', icon: 'build',         path: '/maintenance' },
    { label: 'Alerts',      icon: 'notifications', path: '/alerts' },
    { label: 'Users',       icon: 'people',        path: '/users', adminOnly: true },
  ];

  // Bottom nav shows 5 primary items (no adminOnly ones to keep it clean)
  readonly bottomNavItems: NavItem[] = [
    { label: 'Home',      icon: 'dashboard',    path: '/dashboard' },
    { label: 'Assets',    icon: 'construction', path: '/assets' },
    { label: 'Transfers', icon: 'swap_horiz',   path: '/transfers' },
    { label: 'Maint.',    icon: 'build',        path: '/maintenance' },
    { label: 'Alerts',    icon: 'notifications',path: '/alerts' },
  ];

  readonly user    = this.auth.currentUser;
  readonly isAdmin = computed(() => this.auth.isAdmin());

  isMobile     = signal(false);
  drawerOpened = signal(true);

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
