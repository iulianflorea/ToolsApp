import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login').then((m) => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/layout/layout').then((m) => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'assets',
        loadComponent: () => import('./features/assets/list/asset-list').then((m) => m.AssetListComponent),
      },
      {
        path: 'assets/new',
        loadComponent: () => import('./features/assets/form/asset-form').then((m) => m.AssetFormComponent),
      },
      {
        path: 'assets/:id',
        loadComponent: () => import('./features/assets/detail/asset-detail').then((m) => m.AssetDetailComponent),
      },
      {
        path: 'assets/:id/edit',
        loadComponent: () => import('./features/assets/form/asset-form').then((m) => m.AssetFormComponent),
      },
      {
        path: 'locations',
        loadComponent: () => import('./features/locations/locations').then((m) => m.LocationsComponent),
      },
      {
        path: 'transfers',
        loadComponent: () => import('./features/transfers/transfers').then((m) => m.TransfersComponent),
      },
      {
        path: 'maintenance',
        loadComponent: () => import('./features/maintenance/maintenance').then((m) => m.MaintenanceComponent),
      },
      {
        path: 'alerts',
        loadComponent: () => import('./features/alerts/alerts').then((m) => m.AlertsComponent),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/users/users').then((m) => m.UsersComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
