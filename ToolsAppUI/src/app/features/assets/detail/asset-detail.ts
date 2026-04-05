import { Component, OnInit, signal, ElementRef, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { NgIf, NgClass, CurrencyPipe, DatePipe } from '@angular/common';
import { AssetService } from '../../../core/services/asset.service';
import { TransferService } from '../../../core/services/transfer.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { Asset, Transfer, MaintenanceRecord } from '../../../core/models/models';
import { ScreenService } from '../../../core/services/screen.service';
import QRCode from 'qrcode';

@Component({
  selector: 'app-asset-detail',
  imports: [
    RouterLink,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    NgIf,
    NgClass,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './asset-detail.html',
  styleUrl: './asset-detail.scss',
})
export class AssetDetailComponent implements OnInit {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;
  readonly screen = inject(ScreenService);

  asset = signal<Asset | null>(null);
  transfers = signal<Transfer[]>([]);
  maintenance = signal<MaintenanceRecord[]>([]);

  transferColumns = ['transferDate', 'assignedToUserName', 'toLocationName', 'returnDate', 'status'];
  maintenanceColumns = ['type', 'scheduledDate', 'technicianName', 'cost', 'status'];

  constructor(
    private route: ActivatedRoute,
    private assetService: AssetService,
    private transferService: TransferService,
    private maintenanceService: MaintenanceService,
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.assetService.getById(id).subscribe((a) => {
      this.asset.set(a);
      setTimeout(() => this.generateQrCode(a.qrCode), 200);
    });
    this.transferService.getAll(id).subscribe((t) => this.transfers.set(t));
    this.maintenanceService.getAll(undefined, id).subscribe((m) => this.maintenance.set(m));
  }

  private generateQrCode(qrCode: string): void {
    if (this.qrCanvas?.nativeElement) {
      QRCode.toCanvas(this.qrCanvas.nativeElement, qrCode, { width: 200 });
    }
  }

  statusLabel(s: string): string {
    return s.replace(/_/g, ' ');
  }

  isWarrantyExpired(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }
}
