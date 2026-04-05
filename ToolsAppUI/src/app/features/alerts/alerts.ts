import { Component, OnInit, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { AlertService } from '../../core/services/alert.service';
import { Alert } from '../../core/models/models';

@Component({
  selector: 'app-alerts',
  imports: [
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    NgIf,
    NgFor,
    NgClass,
    DatePipe,
  ],
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss',
})
export class AlertsComponent implements OnInit {
  alerts = signal<Alert[]>([]);

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.alertService.getAll().subscribe((a) => this.alerts.set(a));
  }

  markRead(id: number): void {
    this.alertService.markRead(id).subscribe(() => this.load());
  }

  markAllRead(): void {
    this.alertService.markAllRead().subscribe(() => this.load());
  }

  unreadCount(): number {
    return this.alerts().filter((a) => !a.isRead).length;
  }

  alertIcon(type?: string): string {
    switch (type) {
      case 'MAINTENANCE_DUE': return 'build';
      case 'OVERDUE_RETURN':  return 'warning';
      default:                return 'notifications';
    }
  }
}
