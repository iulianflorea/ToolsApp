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
import { NgIf, NgClass, DatePipe, CurrencyPipe } from '@angular/common';
import { startWith } from 'rxjs';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { AssetService } from '../../core/services/asset.service';
import { MaintenanceRecord, MaintenanceType, Asset } from '../../core/models/models';
import { ScreenService } from '../../core/services/screen.service';

@Component({
  selector: 'app-maintenance',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSelectModule,
    MatCardModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    NgIf,
    NgClass,
    DatePipe,
    CurrencyPipe,
  ],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.scss',
})
export class MaintenanceComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly assetService = inject(AssetService);
  readonly screen = inject(ScreenService);

  records = signal<MaintenanceRecord[]>([]);
  showForm = signal(false);

  displayedColumns = ['asset', 'type', 'scheduledDate', 'technician', 'cost', 'status', 'actions'];
  maintenanceTypes: MaintenanceType[] = ['SCHEDULED', 'REPAIR', 'CALIBRATION'];

  private allAssets: Asset[] = [];
  filteredAssets = signal<Asset[]>([]);

  // Separate control for display — assetId in form holds the actual ID
  assetSearch = new FormControl('');

  form = this.fb.group({
    assetId: [null as number | null, Validators.required],
    type: [null as MaintenanceType | null, Validators.required],
    scheduledDate: [null as Date | null],
    cost: [null as number | null],
    technicianName: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.load();
    this.assetService.getAll().subscribe((assets) => {
      this.allAssets = assets;
      this.filteredAssets.set(assets);
    });

    this.assetSearch.valueChanges.pipe(startWith('')).subscribe((value) => {
      const v = (value || '').toLowerCase();
      this.filteredAssets.set(
        v ? this.allAssets.filter(
          (a) => a.name.toLowerCase().includes(v) || (a.serialNumber || '').toLowerCase().includes(v)
        ) : this.allAssets,
      );
      // dacă userul șterge textul sau modifică fără să selecteze, resetăm assetId
      if (typeof value === 'string') {
        this.form.controls.assetId.setValue(null);
      }
    });
  }

  onAssetSelected(event: MatAutocompleteSelectedEvent): void {
    const asset = event.option.value as Asset;
    this.form.controls.assetId.setValue(asset.id);
    this.assetSearch.setValue(
      asset.name + (asset.serialNumber ? '  ·  ' + asset.serialNumber : ''),
      { emitEvent: false },
    );
  }

  resetForm(): void {
    this.showForm.set(false);
    this.form.reset();
    this.assetSearch.setValue('');
  }

  load(): void {
    this.maintenanceService.getAll().subscribe((r) => this.records.set(r));
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.value;
    this.maintenanceService.create({
      assetId: raw.assetId!,
      type: raw.type!,
      scheduledDate: raw.scheduledDate ? new Date(raw.scheduledDate).toISOString().split('T')[0] : undefined,
      cost: raw.cost ?? undefined,
      technicianName: raw.technicianName || undefined,
      notes: raw.notes || undefined,
    }).subscribe(() => {
      this.resetForm();
      this.load();
    });
  }

  complete(id: number): void {
    if (!confirm('Mark this maintenance as completed?')) return;
    this.maintenanceService.complete(id).subscribe(() => this.load());
  }
}
