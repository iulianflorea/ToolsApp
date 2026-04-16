import { Component, OnInit, signal, ElementRef, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgIf, NgClass, CurrencyPipe, DatePipe } from '@angular/common';
import { startWith } from 'rxjs';
import { toLocalDateString } from '../../../core/utils/date.utils';
import { AssetService } from '../../../core/services/asset.service';
import { TransferService } from '../../../core/services/transfer.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { LocationService } from '../../../core/services/location.service';
import { UserService } from '../../../core/services/user.service';
import { Asset, Transfer, MaintenanceRecord, MaintenanceType, Location, AppUser } from '../../../core/models/models';
import { ScreenService } from '../../../core/services/screen.service';
import { PrintDialogComponent } from '../../../components/print-dialog/print-dialog.component';
import { PrinterService } from '../../../core/services/printer.service';
import { PrinterInfo } from '../../../core/models/printer.models';
import QRCode from 'qrcode';

@Component({
  selector: 'app-asset-detail',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
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
  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;
  readonly screen = inject(ScreenService);
  private readonly fb = inject(FormBuilder);
  private readonly locationService = inject(LocationService);
  private readonly userService = inject(UserService);

  asset = signal<Asset | null>(null);
  transfers = signal<Transfer[]>([]);
  maintenance = signal<MaintenanceRecord[]>([]);
  uploadingPhoto = signal(false);

  // Quick-transfer form
  showTransferForm = signal(false);
  savingTransfer = signal(false);

  private allLocations: Location[] = [];
  private allUsers: AppUser[] = [];
  filteredLocs = signal<Location[]>([]);
  filteredUsers = signal<AppUser[]>([]);

  toLocSearch   = new FormControl('');
  userSearch    = new FormControl('');
  indefinitePeriod = new FormControl(false);

  transferForm = this.fb.group({
    fromLocationId: [null as number | null],
    toLocationId:   [null as number | null],
    assignedToUserId: [null as number | null],
    returnDate:     [null as Date | null],
    notes:          [''],
  });

  // Quick-maintenance form
  showMaintenanceForm = signal(false);
  savingMaintenance = signal(false);
  maintenanceTypes: MaintenanceType[] = ['SCHEDULED', 'REPAIR', 'CALIBRATION'];

  maintenanceForm = this.fb.group({
    type: [null as MaintenanceType | null, Validators.required],
    scheduledDate: [null as Date | null],
    technicianName: [''],
    cost: [null as number | null],
    notes: [''],
  });

  lastPrinter = signal<PrinterInfo | null>(null);
  quickPrinting = signal(false);
  quickPrintStatus = signal<'idle' | 'success' | 'error'>('idle');
  quickPrintError = '';

  transferColumns = ['transferDate', 'assignedToUserName', 'toLocationName', 'returnDate', 'status'];
  maintenanceColumns = ['type', 'scheduledDate', 'technicianName', 'cost', 'status'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private assetService: AssetService,
    private transferService: TransferService,
    private maintenanceService: MaintenanceService,
    private dialog: MatDialog,
    private printerService: PrinterService,
  ) {}

  ngOnInit(): void {
    this.lastPrinter.set(this.printerService.getLastPrinter());
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.assetService.getById(id).subscribe((a) => {
      this.asset.set(a);
      setTimeout(() => this.generateQrCode(a.qrCode), 200);
    });
    this.transferService.getAll(id).subscribe((t) => this.transfers.set(t));
    this.maintenanceService.getAll(undefined, id).subscribe((m) => this.maintenance.set(m));

    this.locationService.getAll().subscribe((locs) => {
      this.allLocations = locs;
      this.filteredLocs.set(locs);
    });
    this.userService.getAll().subscribe((users) => {
      this.allUsers = users;
      this.filteredUsers.set(users);
    });

    this.toLocSearch.valueChanges.pipe(startWith('')).subscribe((v) => {
      const q = (v || '').toLowerCase();
      this.filteredLocs.set(q ? this.allLocations.filter((l) => l.name.toLowerCase().includes(q)) : this.allLocations);
      if (typeof v === 'string') this.transferForm.controls.toLocationId.setValue(null);
    });

    this.userSearch.valueChanges.pipe(startWith('')).subscribe((v) => {
      const q = (v || '').toLowerCase();
      this.filteredUsers.set(q ? this.allUsers.filter((u) => u.fullName.toLowerCase().includes(q)) : this.allUsers);
      if (typeof v === 'string') this.transferForm.controls.assignedToUserId.setValue(null);
    });
  }

  // ── Quick transfer ──────────────────────────────────────────────────────────

  openTransferForm(): void {
    const a = this.asset();
    if (a) {
      this.transferForm.controls.fromLocationId.setValue(a.currentLocationId ?? null);
    }
    this.showTransferForm.set(true);
  }

  cancelTransferForm(): void {
    this.showTransferForm.set(false);
    this.transferForm.reset();
    this.toLocSearch.setValue('');
    this.userSearch.setValue('');
    this.indefinitePeriod.setValue(false);
  }

  onToLocSelected(event: MatAutocompleteSelectedEvent): void {
    const l = event.option.value as Location;
    this.transferForm.controls.toLocationId.setValue(l.id);
    this.toLocSearch.setValue(l.name, { emitEvent: false });
  }

  onUserSelected(event: MatAutocompleteSelectedEvent): void {
    const u = event.option.value as AppUser;
    this.transferForm.controls.assignedToUserId.setValue(u.id);
    this.userSearch.setValue(u.fullName, { emitEvent: false });
  }

  submitTransfer(): void {
    const a = this.asset();
    if (!a) return;
    const raw = this.transferForm.value;
    const indeterminate = !!this.indefinitePeriod.value;
    this.savingTransfer.set(true);
    this.transferService.create({
      assetId:          a.id,
      fromLocationId:   raw.fromLocationId ?? undefined,
      toLocationId:     raw.toLocationId   ?? undefined,
      assignedToUserId: raw.assignedToUserId ?? undefined,
      returnDate:       (!indeterminate && raw.returnDate)
                          ? toLocalDateString(new Date(raw.returnDate))
                          : undefined,
      indefinitePeriod: indeterminate,
      notes:            raw.notes || undefined,
    }).subscribe({
      next: () => {
        this.cancelTransferForm();
        this.savingTransfer.set(false);
        // Reload asset + transfers
        this.assetService.getById(a.id).subscribe((updated) => this.asset.set(updated));
        this.transferService.getAll(a.id).subscribe((t) => this.transfers.set(t));
      },
      error: () => this.savingTransfer.set(false),
    });
  }

  // ── Quick maintenance ───────────────────────────────────────────────────────

  openMaintenanceForm(): void {
    this.showMaintenanceForm.set(true);
  }

  cancelMaintenanceForm(): void {
    this.showMaintenanceForm.set(false);
    this.maintenanceForm.reset();
  }

  submitMaintenance(): void {
    const a = this.asset();
    if (!a || this.maintenanceForm.invalid) return;
    const raw = this.maintenanceForm.value;
    this.savingMaintenance.set(true);
    this.maintenanceService.create({
      assetId: a.id,
      type: raw.type!,
      scheduledDate: raw.scheduledDate ? new Date(raw.scheduledDate).toISOString().split('T')[0] : undefined,
      cost: raw.cost ?? undefined,
      technicianName: raw.technicianName || undefined,
      notes: raw.notes || undefined,
    }).subscribe({
      next: () => {
        this.cancelMaintenanceForm();
        this.savingMaintenance.set(false);
        this.maintenanceService.getAll(undefined, a.id).subscribe((m) => this.maintenance.set(m));
      },
      error: () => this.savingMaintenance.set(false),
    });
  }

  // ── Photo ─────────────────────────────────────────────────────────────────

  private generateQrCode(qrCode: string): void {
    if (this.qrCanvas?.nativeElement) {
      QRCode.toCanvas(this.qrCanvas.nativeElement, qrCode, { width: 200 });
    }
  }

  triggerPhotoUpload(): void {
    this.photoInput?.nativeElement.click();
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.asset()) return;

    this.uploadingPhoto.set(true);
    this.assetService.uploadImage(file).subscribe({
      next: (res) => {
        const a = this.asset()!;
        const request = {
          name: a.name,
          serialNumber: a.serialNumber,
          category: a.category,
          status: a.status,
          purchaseDate: a.purchaseDate as unknown as string,
          purchasePrice: a.purchasePrice,
          warrantyMonths: a.warrantyMonths,
          notes: a.notes,
          imageUrl: res.url,
        };
        this.assetService.update(a.id, request).subscribe({
          next: (updated) => {
            this.asset.set(updated);
            this.uploadingPhoto.set(false);
          },
          error: () => this.uploadingPhoto.set(false),
        });
      },
      error: () => this.uploadingPhoto.set(false),
    });
  }

  deleteAsset(): void {
    if (!confirm('Ștergi această unealtă?')) return;
    this.assetService.delete(this.asset()!.id).subscribe(() => {
      this.router.navigate(['/assets']);
    });
  }

  openPrintDialog(): void {
    const a = this.asset();
    if (!a) return;
    const ref = this.dialog.open(PrintDialogComponent, {
      data: { qrCode: a.qrCode, assetName: a.name, serialNumber: a.serialNumber },
      width: '600px',
      disableClose: false,
    });
    ref.afterClosed().subscribe(() => {
      // refresh last printer in case user printed inside dialog
      this.lastPrinter.set(this.printerService.getLastPrinter());
    });
  }

  quickPrintZpl(): void {
    const a = this.asset();
    const printer = this.lastPrinter();
    if (!a || !printer) return;

    this.quickPrinting.set(true);
    this.quickPrintStatus.set('idle');
    this.quickPrintError = '';

    this.printerService.getLabelConfig().subscribe({
      next: (config) => {
        this.printerService.print({
          printerIp: printer.ip,
          printerPort: printer.port,
          qrCode: a.qrCode,
          labelText: a.name,
          serialText: a.serialNumber ?? '',
          ...config,
        }).subscribe({
          next: () => {
            this.quickPrinting.set(false);
            this.quickPrintStatus.set('success');
            setTimeout(() => this.quickPrintStatus.set('idle'), 2500);
          },
          error: (e) => {
            this.quickPrinting.set(false);
            this.quickPrintStatus.set('error');
            this.quickPrintError = e.error || 'Eroare la printare';
            setTimeout(() => this.quickPrintStatus.set('idle'), 4000);
          },
        });
      },
      error: () => {
        this.quickPrinting.set(false);
        this.quickPrintStatus.set('error');
        this.quickPrintError = 'Nu s-au putut încărca setările';
        setTimeout(() => this.quickPrintStatus.set('idle'), 4000);
      },
    });
  }

  statusLabel(s: string): string {
    return s.replace(/_/g, ' ');
  }

  isWarrantyExpired(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }

  isMetrologyExpired(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }
}
