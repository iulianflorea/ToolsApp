import { Component, OnInit, signal, ElementRef, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
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
import { NgIf, NgClass, CurrencyPipe, DatePipe } from '@angular/common';
import { startWith } from 'rxjs';
import { toLocalDateString } from '../../../core/utils/date.utils';
import { AssetService } from '../../../core/services/asset.service';
import { TransferService } from '../../../core/services/transfer.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { LocationService } from '../../../core/services/location.service';
import { UserService } from '../../../core/services/user.service';
import { Asset, Transfer, MaintenanceRecord, Location, AppUser } from '../../../core/models/models';
import { ScreenService } from '../../../core/services/screen.service';
import { QrPrintService, PRINT_SIZES, PrintSize } from '../../../core/services/qr-print.service';
import { BluetoothPrintService } from '../../../core/services/bluetooth-print.service';
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
  private readonly qrPrint = inject(QrPrintService);
  readonly bt = inject(BluetoothPrintService);
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

  printSizes = PRINT_SIZES;
  selectedPrintSize = signal<PrintSize>(PRINT_SIZES[4]);

  transferColumns = ['transferDate', 'assignedToUserName', 'toLocationName', 'returnDate', 'status'];
  maintenanceColumns = ['type', 'scheduledDate', 'technicianName', 'cost', 'status'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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

  printQr(): void {
    const a = this.asset();
    if (a?.qrCode) {
      this.qrPrint.print(a.qrCode, a.name, this.selectedPrintSize().mm);
    }
  }

  async printBt(): Promise<void> {
    const a = this.asset();
    if (a?.qrCode) {
      await this.bt.printQr(a.qrCode, a.name, this.selectedPrintSize().mm);
    }
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
