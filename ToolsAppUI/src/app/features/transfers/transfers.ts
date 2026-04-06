import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { NgIf, NgClass, DatePipe } from '@angular/common';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { startWith } from 'rxjs';
import { toLocalDateString } from '../../core/utils/date.utils';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { TransferService } from '../../core/services/transfer.service';
import { AssetService } from '../../core/services/asset.service';
import { LocationService } from '../../core/services/location.service';
import { UserService } from '../../core/services/user.service';
import { Transfer, TransferStatus, Asset, Location, AppUser } from '../../core/models/models';
import { ScreenService } from '../../core/services/screen.service';

@Component({
  selector: 'app-transfers',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    NgIf,
    NgClass,
    DatePipe,
    ZXingScannerModule,
    TranslatePipe,
  ],
  templateUrl: './transfers.html',
  styleUrl: './transfers.scss',
})
export class TransfersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly transferService = inject(TransferService);
  private readonly assetService = inject(AssetService);
  private readonly locationService = inject(LocationService);
  private readonly userService = inject(UserService);
  readonly screen = inject(ScreenService);

  transfers = signal<Transfer[]>([]);
  showForm = signal(false);

  displayedColumns = ['asset', 'assignedTo', 'fromLocation', 'toLocation', 'transferDate', 'returnDate', 'status', 'actions'];
  statuses: TransferStatus[] = ['ACTIVE', 'RETURNED'];
  statusFilter = signal<TransferStatus | undefined>(undefined);
  fromDateCtrl = new FormControl<Date | null>(null);
  toDateCtrl   = new FormControl<Date | null>(null);

  // QR scanner states
  scanningAsset = signal(false);
  scanningUser  = signal(false);
  scanError     = signal('');

  // raw data
  private allAssets: Asset[] = [];
  private allUsers: AppUser[] = [];
  private allLocations: Location[] = [];

  // filtered signals
  filteredAssets    = signal<Asset[]>([]);
  filteredUsers     = signal<AppUser[]>([]);
  filteredFromLocs  = signal<Location[]>([]);
  filteredToLocs    = signal<Location[]>([]);

  // display controls (outside form group)
  assetSearch    = new FormControl('');
  userSearch     = new FormControl('');
  fromLocSearch  = new FormControl('');
  toLocSearch    = new FormControl('');

  indefinitePeriod = new FormControl(false);

  form = this.fb.group({
    assetId:          [null as number | null, Validators.required],
    assignedToUserId: [null as number | null],
    fromLocationId:   [null as number | null],
    toLocationId:     [null as number | null],
    returnDate:       [null as Date | null],
    notes:            [''],
  });

  ngOnInit(): void {
    this.load();

    this.fromDateCtrl.valueChanges.subscribe(() => this.load());
    this.toDateCtrl.valueChanges.subscribe(() => this.load());

    this.assetService.getAll().subscribe((a) => {
      this.allAssets = a;
      this.filteredAssets.set(a);
    });
    this.locationService.getAll().subscribe((l) => {
      this.allLocations = l;
      this.filteredFromLocs.set(l);
      this.filteredToLocs.set(l);
    });
    this.userService.getAll().subscribe((u) => {
      this.allUsers = u;
      this.filteredUsers.set(u);
    });

    this.assetSearch.valueChanges.pipe(startWith('')).subscribe((v) => {
      const q = (v || '').toLowerCase();
      this.filteredAssets.set(
        q ? this.allAssets.filter(
          (a) => a.name.toLowerCase().includes(q) || (a.serialNumber || '').toLowerCase().includes(q)
        ) : this.allAssets,
      );
      if (typeof v === 'string') this.form.controls.assetId.setValue(null);
    });

    this.userSearch.valueChanges.pipe(startWith('')).subscribe((v) => {
      const q = (v || '').toLowerCase();
      this.filteredUsers.set(
        q ? this.allUsers.filter((u) => u.fullName.toLowerCase().includes(q)) : this.allUsers,
      );
      if (typeof v === 'string') this.form.controls.assignedToUserId.setValue(null);
    });

    this.fromLocSearch.valueChanges.pipe(startWith('')).subscribe((v) => {
      const q = (v || '').toLowerCase();
      this.filteredFromLocs.set(
        q ? this.allLocations.filter((l) => l.name.toLowerCase().includes(q)) : this.allLocations,
      );
      if (typeof v === 'string') this.form.controls.fromLocationId.setValue(null);
    });

    this.toLocSearch.valueChanges.pipe(startWith('')).subscribe((v) => {
      const q = (v || '').toLowerCase();
      this.filteredToLocs.set(
        q ? this.allLocations.filter((l) => l.name.toLowerCase().includes(q)) : this.allLocations,
      );
      if (typeof v === 'string') this.form.controls.toLocationId.setValue(null);
    });
  }

  // ── Autocomplete handlers ────────────────────────���───────────────────────────

  onAssetSelected(event: MatAutocompleteSelectedEvent): void {
    const a = event.option.value as Asset;
    this.selectAsset(a);
  }

  onUserSelected(event: MatAutocompleteSelectedEvent): void {
    const u = event.option.value as AppUser;
    this.selectUser(u);
  }

  onFromLocSelected(event: MatAutocompleteSelectedEvent): void {
    const l = event.option.value as Location;
    this.form.controls.fromLocationId.setValue(l.id);
    this.fromLocSearch.setValue(l.name, { emitEvent: false });
  }

  onToLocSelected(event: MatAutocompleteSelectedEvent): void {
    const l = event.option.value as Location;
    this.form.controls.toLocationId.setValue(l.id);
    this.toLocSearch.setValue(l.name, { emitEvent: false });
  }

  // ── QR scanner ──────────────────────────────────────────────────────────────

  toggleAssetScanner(): void {
    this.scanError.set('');
    this.scanningUser.set(false);
    this.scanningAsset.set(!this.scanningAsset());
  }

  toggleUserScanner(): void {
    this.scanError.set('');
    this.scanningAsset.set(false);
    this.scanningUser.set(!this.scanningUser());
  }

  onAssetScan(result: string): void {
    this.scanningAsset.set(false);
    this.assetService.getByQrCode(result).subscribe({
      next: (a) => { this.selectAsset(a); this.scanError.set(''); },
      error: () => this.scanError.set('Unealta nu a fost găsită pentru codul scanat.'),
    });
  }

  onUserScan(result: string): void {
    this.scanningUser.set(false);
    this.userService.getByQrCode(result).subscribe({
      next: (u) => { this.selectUser(u); this.scanError.set(''); },
      error: () => this.scanError.set('Utilizatorul nu a fost găsit pentru codul scanat.'),
    });
  }

  onScanError(): void {
    this.scanError.set('Eroare cameră. Acordă permisiunea de acces la cameră.');
  }

  private selectAsset(a: Asset): void {
    this.form.controls.assetId.setValue(a.id);
    this.assetSearch.setValue(
      a.name + (a.serialNumber ? '  ·  ' + a.serialNumber : ''), { emitEvent: false }
    );
    // Auto-fill from location from the asset's current location
    if (a.currentLocationId && a.currentLocationName) {
      this.form.controls.fromLocationId.setValue(a.currentLocationId);
      this.fromLocSearch.setValue(a.currentLocationName, { emitEvent: false });
    } else {
      this.form.controls.fromLocationId.setValue(null);
      this.fromLocSearch.setValue('', { emitEvent: false });
    }
  }

  private selectUser(u: AppUser): void {
    this.form.controls.assignedToUserId.setValue(u.id);
    this.userSearch.setValue(u.fullName, { emitEvent: false });
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  load(): void {
    const fromDate = toLocalDateString(this.fromDateCtrl.value ?? undefined);
    const toDate   = toLocalDateString(this.toDateCtrl.value ?? undefined);
    this.transferService.getAll(undefined, undefined, this.statusFilter(), fromDate, toDate)
      .subscribe((t) => this.transfers.set(t));
  }

  clearDateFilter(): void {
    this.fromDateCtrl.setValue(null, { emitEvent: false });
    this.toDateCtrl.setValue(null, { emitEvent: false });
    this.load();
  }

  filterByStatus(status: TransferStatus | ''): void {
    this.statusFilter.set(status || undefined);
    this.load();
  }

  resetForm(): void {
    this.showForm.set(false);
    this.scanningAsset.set(false);
    this.scanningUser.set(false);
    this.scanError.set('');
    this.form.reset();
    this.indefinitePeriod.setValue(false);
    this.assetSearch.setValue('');
    this.userSearch.setValue('');
    this.fromLocSearch.setValue('');
    this.toLocSearch.setValue('');
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.value;
    const indeterminate = !!this.indefinitePeriod.value;
    const request = {
      assetId:          raw.assetId!,
      assignedToUserId: raw.assignedToUserId ?? undefined,
      fromLocationId:   raw.fromLocationId   ?? undefined,
      toLocationId:     raw.toLocationId     ?? undefined,
      returnDate:       (!indeterminate && raw.returnDate)
                          ? toLocalDateString(new Date(raw.returnDate))
                          : undefined,
      indefinitePeriod: indeterminate,
      notes:            raw.notes || undefined,
    };
    this.transferService.create(request).subscribe(() => {
      this.resetForm();
      this.load();
    });
  }

  returnAsset(id: number): void {
    if (!confirm('Mark this transfer as returned?')) return;
    this.transferService.return(id).subscribe(() => this.load());
  }

  deleteTransfer(id: number): void {
    if (!confirm('Ștergi acest transfer?')) return;
    this.transferService.delete(id).subscribe(() => this.load());
  }
}
