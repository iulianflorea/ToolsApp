import { Component, OnInit, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { AlertService } from '../../core/services/alert.service';
import { Alert } from '../../core/models/models';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';

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
    TranslatePipe,
  ],
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss',
})
export class AlertsComponent implements OnInit {
  alerts = signal<Alert[]>([]);

  constructor(private alertService: AlertService, private ts: TranslationService) {}

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

  delete(id: number): void {
    this.alertService.delete(id).subscribe(() => this.load());
  }

  unreadCount(): number {
    return this.alerts().filter((a) => !a.isRead).length;
  }

  alertMessage(alert: Alert): string {
    const name = alert.assetName || '?';
    const date = alert.alertDate || '';
    const days = alert.daysRemaining;
    const extra = alert.alertExtra || '';
    const dayWord = days === 1 ? this.ts.t('alert.day') : this.ts.t('alert.days');

    switch (alert.type) {
      case 'METROLOGY_EXPIRING':
        if (alert.urgent && days === 0) return this.ts.tf('alert.metrologyToday', name, date);
        if (alert.urgent) return this.ts.tf('alert.metrologyExpired', name, date);
        return this.ts.tf('alert.metrologyExpiring', name, date, days ?? '', dayWord);
      case 'WARRANTY_EXPIRING':
        if (alert.urgent && days === 0) return this.ts.tf('alert.warrantyToday', name, date);
        if (alert.urgent) return this.ts.tf('alert.warrantyExpired', name, date);
        return this.ts.tf('alert.warrantyExpiring', name, date, days ?? '', dayWord);
      case 'MAINTENANCE_DUE':
        return this.ts.tf('alert.maintenanceDue', name, date, extra);
      case 'OVERDUE_RETURN':
        return this.ts.tf('alert.overdueReturn', name, date);
      default:
        return alert.message;
    }
  }

  alertIcon(type?: string): string {
    switch (type) {
      case 'MAINTENANCE_DUE':    return 'build';
      case 'OVERDUE_RETURN':     return 'warning';
      case 'WARRANTY_EXPIRING':  return 'verified_user';
      case 'METROLOGY_EXPIRING': return 'science';
      default:                   return 'notifications';
    }
  }

  alertColor(alert: { type?: string; urgent?: boolean }): string {
    if (alert.urgent) return 'var(--red)';
    switch (alert.type) {
      case 'MAINTENANCE_DUE':    return 'var(--orange)';
      case 'OVERDUE_RETURN':     return 'var(--red)';
      case 'WARRANTY_EXPIRING':  return 'var(--blue)';
      case 'METROLOGY_EXPIRING': return 'var(--blue)';
      default:                   return 'var(--text-secondary)';
    }
  }
}
