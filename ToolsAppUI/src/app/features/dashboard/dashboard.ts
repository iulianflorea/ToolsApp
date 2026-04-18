import { Component, OnInit, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard.service';
import { AlertService } from '../../core/services/alert.service';
import { TransferService } from '../../core/services/transfer.service';
import { AssetService } from '../../core/services/asset.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryStats, DashboardStats, Alert, Transfer, Asset, AssetStatus } from '../../core/models/models';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatTooltipModule,
    NgIf,
    NgFor,
    DatePipe,
    ZXingScannerModule,
    TranslatePipe,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly alertService = inject(AlertService);
  private readonly transferService = inject(TransferService);
  private readonly assetService = inject(AssetService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  stats = signal<DashboardStats | null>(null);
  recentAlerts = signal<Alert[]>([]);
  recentTransfers = signal<Transfer[]>([]);
  loading = signal(true);

  categoryStats = signal<CategoryStats[]>([]);
  activeCard = signal<string | null>(null);

  // Category drill-down
  activeCategoryRow = signal<string | null>(null);
  categoryAssets = signal<Asset[]>([]);
  loadingCategory = signal(false);

  // Asset search
  searchCtrl = new FormControl('');
  searchResults = signal<Asset[]>([]);
  searchError = signal('');
  scanningDash = signal(false);
  scanError = signal('');

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
    this.dashboardService.getCategoryStats().subscribe((c) => this.categoryStats.set(c));

    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) => q && q.length >= 1 ? this.assetService.getAll(undefined, undefined, q) : of([]))
      )
      .subscribe((results) => this.searchResults.set(results));
  }

  toggleCard(card: string): void {
    this.activeCard.set(this.activeCard() === card ? null : card);
    // Reset category drill-down when switching stat card
    this.activeCategoryRow.set(null);
    this.categoryAssets.set([]);
  }

  private cardToStatus(card: string): AssetStatus | undefined {
    switch (card) {
      case 'available':     return 'AVAILABLE';
      case 'inUse':         return 'IN_USE';
      case 'inMaintenance': return 'IN_MAINTENANCE';
      case 'retired':       return 'RETIRED';
      default:              return undefined;
    }
  }

  selectCategory(row: CategoryStats): void {
    const count = this.categoryValue(row, this.activeCard() ?? 'total');
    if (count === 0) return;

    if (this.activeCategoryRow() === row.category) {
      this.activeCategoryRow.set(null);
      this.categoryAssets.set([]);
      return;
    }
    this.activeCategoryRow.set(row.category);
    this.categoryAssets.set([]);
    this.loadingCategory.set(true);
    const status = this.cardToStatus(this.activeCard() ?? 'total');
    this.assetService.getAll(status, row.category).subscribe({
      next: (assets) => { this.categoryAssets.set(assets); this.loadingCategory.set(false); },
      error: () => this.loadingCategory.set(false),
    });
  }

  categoryValue(row: CategoryStats, card: string): number {
    switch (card) {
      case 'available':     return row.available;
      case 'inUse':         return row.inUse;
      case 'inMaintenance': return row.inMaintenance;
      case 'retired':       return row.retired;
      default:              return row.total;
    }
  }

  onAssetSelected(event: MatAutocompleteSelectedEvent): void {
    const asset = event.option.value as Asset;
    this.navigateToAsset(asset);
  }

  onSearchEnter(): void {
    const query = (this.searchCtrl.value ?? '').trim();
    if (!query) return;

    this.searchError.set('');
    const results = this.searchResults();

    const exactSerial = results.find(
      (a) => a.serialNumber?.toLowerCase() === query.toLowerCase()
    );
    if (exactSerial) { this.navigateToAsset(exactSerial); return; }

    if (results.length === 1) { this.navigateToAsset(results[0]); return; }

    this.assetService.getByQrCode(query).subscribe({
      next: (asset) => this.navigateToAsset(asset),
      error: () => this.searchError.set('Unealta nu a fost găsită pentru seria sau codul introdus.'),
    });
  }

  private navigateToAsset(asset: Asset): void {
    this.searchCtrl.setValue('', { emitEvent: false });
    this.searchResults.set([]);
    this.searchError.set('');
    this.router.navigate(['/assets', asset.id]);
  }

  toggleDashScanner(): void {
    this.scanError.set('');
    this.scanningDash.set(!this.scanningDash());
  }

  onDashScan(result: string): void {
    this.scanningDash.set(false);
    this.assetService.getByQrCode(result).subscribe({
      next: (asset) => this.router.navigate(['/assets', asset.id]),
      error: () => this.scanError.set('Unealta nu a fost găsită pentru codul scanat.'),
    });
  }

  onScanError(): void {
    this.scanError.set('Eroare cameră. Acordă permisiunea de acces la cameră.');
  }

  displayFn(asset: Asset): string {
    return asset ? asset.name : '';
  }
}
