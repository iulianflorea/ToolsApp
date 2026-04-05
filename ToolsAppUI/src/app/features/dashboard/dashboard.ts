import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { DashboardService } from '../../core/services/dashboard.service';
import { AlertService } from '../../core/services/alert.service';
import { TransferService } from '../../core/services/transfer.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats, Alert, Transfer } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    NgIf,
    NgFor,
    DatePipe,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly alertService = inject(AlertService);
  private readonly transferService = inject(TransferService);
  private readonly auth = inject(AuthService);

  stats = signal<DashboardStats | null>(null);
  recentAlerts = signal<Alert[]>([]);
  recentTransfers = signal<Transfer[]>([]);
  loading = signal(true);

  readonly user = this.auth.currentUser;

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe((s) => {
      this.stats.set(s);
      this.loading.set(false);
    });
    this.alertService.getAll().subscribe((alerts) => {
      this.recentAlerts.set(alerts.filter((a) => !a.isRead).slice(0, 5));
    });
    this.transferService.getAll(undefined, undefined, 'ACTIVE').subscribe((t) => {
      this.recentTransfers.set(t.slice(0, 5));
    });
  }
}
