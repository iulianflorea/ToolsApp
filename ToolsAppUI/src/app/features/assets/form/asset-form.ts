import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { NgIf } from '@angular/common';
import { startWith } from 'rxjs';
import { AssetService } from '../../../core/services/asset.service';
import { Asset, AssetStatus } from '../../../core/models/models';

@Component({
  selector: 'app-asset-form',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    NgIf,
  ],
  templateUrl: './asset-form.html',
  styleUrl: './asset-form.scss',
})
export class AssetFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly assetService = inject(AssetService);

  isEdit = false;
  assetId?: number;
  loading = false;
  error = '';

  statuses: AssetStatus[] = ['AVAILABLE', 'IN_USE', 'IN_MAINTENANCE', 'RETIRED'];
  categories = ['Power Tools', 'Safety', 'Heavy Machinery', 'Power', 'Measurement', 'Construction', 'Electrical'];

  private allAssets: Asset[] = [];
  filteredAssets = signal<Asset[]>([]);

  form = this.fb.group({
    name: ['', Validators.required],
    serialNumber: [''],
    category: [''],
    status: ['AVAILABLE' as AssetStatus],
    purchaseDate: [null as Date | null],
    purchasePrice: [null as number | null],
    warrantyMonths: [null as number | null],
    notes: [''],
    imageUrl: [''],
  });

  ngOnInit(): void {
    this.assetId = this.route.snapshot.paramMap.get('id') ? +this.route.snapshot.paramMap.get('id')! : undefined;
    this.isEdit = !!this.assetId;

    this.assetService.getAll().subscribe((assets) => {
      this.allAssets = assets;
      this.filteredAssets.set(assets);
    });

    this.form.get('name')!.valueChanges.pipe(startWith('')).subscribe((value) => {
      const v = (value || '').toLowerCase();
      this.filteredAssets.set(
        v ? this.allAssets.filter((a) => a.name.toLowerCase().includes(v)) : this.allAssets,
      );
    });

    if (this.isEdit && this.assetId) {
      this.assetService.getById(this.assetId).subscribe((a) => {
        this.form.patchValue({
          name: a.name,
          serialNumber: a.serialNumber || '',
          category: a.category || '',
          status: a.status,
          purchaseDate: a.purchaseDate ? new Date(a.purchaseDate) : null,
          purchasePrice: a.purchasePrice ?? null,
          warrantyMonths: a.warrantyMonths ?? null,
          notes: a.notes || '',
          imageUrl: a.imageUrl || '',
        });
      });
    }
  }

  onNameSelected(event: MatAutocompleteSelectedEvent): void {
    const selected = this.allAssets.find((a) => a.name === event.option.value);
    if (selected?.category) {
      this.form.patchValue({ category: selected.category });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const raw = this.form.value;
    const request = {
      name: raw.name!,
      serialNumber: raw.serialNumber || undefined,
      category: raw.category || undefined,
      status: raw.status as AssetStatus,
      purchaseDate: raw.purchaseDate ? new Date(raw.purchaseDate).toISOString().split('T')[0] : undefined,
      purchasePrice: raw.purchasePrice ?? undefined,
      warrantyMonths: raw.warrantyMonths ?? undefined,
      notes: raw.notes || undefined,
      imageUrl: raw.imageUrl || undefined,
    };

    const obs = this.isEdit
      ? this.assetService.update(this.assetId!, request)
      : this.assetService.create(request);

    obs.subscribe({
      next: (a) => this.router.navigate(['/assets', a.id]),
      error: (err) => { this.error = err.error?.message || 'Failed to save'; this.loading = false; },
    });
  }
}
