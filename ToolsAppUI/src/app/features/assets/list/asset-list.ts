import { Component, OnInit, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf, NgClass, SlicePipe } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { AssetService } from '../../../core/services/asset.service';
import { ScreenService } from '../../../core/services/screen.service';
import { Asset, AssetStatus } from '../../../core/models/models';

@Component({
  selector: 'app-asset-list',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgIf,
    NgClass,
    SlicePipe,
    ZXingScannerModule,
    TranslatePipe,
  ],
  templateUrl: './asset-list.html',
  styleUrl: './asset-list.scss',
})
export class AssetListComponent implements OnInit {
  assets = signal<Asset[]>([]);
  loading = signal(true);
  scanning = signal(false);
  scanError = signal('');

  displayedColumns = ['image', 'name', 'serialNumber', 'category', 'status', 'qrCode', 'actions'];
  statuses: AssetStatus[] = ['AVAILABLE', 'IN_USE', 'IN_MAINTENANCE', 'RETIRED'];

  searchCtrl = new FormControl('');
  statusCtrl = new FormControl<AssetStatus | ''>('');
  categoryCtrl = new FormControl('');

  categories = ['Power Tools', 'Safety', 'Heavy Machinery', 'Power', 'Measurement', 'Construction', 'Electrical'];

  readonly screen = inject(ScreenService);

  constructor(private assetService: AssetService, private router: Router) {}

  ngOnInit(): void {
    this.loadAssets();
    this.searchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.loadAssets());
    this.statusCtrl.valueChanges.subscribe(() => this.loadAssets());
    this.categoryCtrl.valueChanges.subscribe(() => this.loadAssets());
  }

  loadAssets(): void {
    this.loading.set(true);
    const status = this.statusCtrl.value as AssetStatus | undefined;
    const category = this.categoryCtrl.value || undefined;
    const q = this.searchCtrl.value || undefined;
    this.assetService.getAll(status || undefined, category, q).subscribe({
      next: (data) => { this.assets.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleScanner(): void {
    this.scanError.set('');
    this.scanning.set(!this.scanning());
  }

  onScanSuccess(result: string): void {
    this.scanning.set(false);
    this.assetService.getByQrCode(result).subscribe({
      next: (asset) => this.router.navigate(['/assets', asset.id]),
      error: () => this.scanError.set('Asset not found for scanned code: ' + result),
    });
  }

  onScanError(error: unknown): void {
    console.error('Scanner error', error);
    this.scanError.set('Camera error. Make sure camera permission is granted.');
  }

  delete(id: number): void {
    if (!confirm('Delete this asset?')) return;
    this.assetService.delete(id).subscribe(() => this.loadAssets());
  }

  statusClass(status: AssetStatus): string {
    return status.toLowerCase().replace('_', '_');
  }

  statusLabel(s: AssetStatus): string {
    return s.replace(/_/g, ' ');
  }
}
