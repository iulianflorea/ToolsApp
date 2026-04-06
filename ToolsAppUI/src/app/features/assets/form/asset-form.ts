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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgIf } from '@angular/common';
import { FormControl } from '@angular/forms';
import { startWith, map } from 'rxjs';
import { toLocalDateString } from '../../../core/utils/date.utils';
import { AssetService } from '../../../core/services/asset.service';
import { CategoryService } from '../../../core/services/category.service';
import { LocationService } from '../../../core/services/location.service';
import { Asset, AssetStatus, Location } from '../../../core/models/models';

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
    MatProgressSpinnerModule,
    MatSnackBarModule,
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
  private readonly categoryService = inject(CategoryService);
  private readonly locationService = inject(LocationService);
  private readonly snackBar = inject(MatSnackBar);

  isEdit = false;
  assetId?: number;
  loading = false;
  error = '';

  imagePreview = signal<string>('');
  uploading = signal(false);

  statuses: AssetStatus[] = ['AVAILABLE', 'IN_USE', 'IN_MAINTENANCE', 'RETIRED'];

  // Category autocomplete
  categoryCtrl = new FormControl('');
  allCategories: string[] = [];
  filteredCategories = signal<string[]>([]);

  // Asset name autocomplete
  private allAssets: Asset[] = [];
  filteredAssets = signal<Asset[]>([]);

  // Locations
  allLocations: Location[] = [];
  filteredLocations = signal<Location[]>([]);
  locationCtrl = new FormControl('');

  form = this.fb.group({
    name: ['', Validators.required],
    serialNumber: [''],
    status: ['AVAILABLE' as AssetStatus],
    purchaseDate: [null as Date | null],
    purchasePrice: [null as number | null],
    warrantyMonths: [null as number | null],
    metrologyDate: [null as Date | null],
    metrologyExpiryDate: [null as Date | null],
    notes: [''],
    imageUrl: [''],
    locationId: [null as number | null],
  });

  ngOnInit(): void {
    this.assetId = this.route.snapshot.paramMap.get('id') ? +this.route.snapshot.paramMap.get('id')! : undefined;
    this.isEdit = !!this.assetId;

    // Load categories
    this.categoryService.getAll().subscribe((cats) => {
      this.allCategories = cats;
      this.filteredCategories.set(cats);
    });

    // Filter categories as user types
    this.categoryCtrl.valueChanges.pipe(startWith('')).subscribe((v) => {
      const q = (v || '').toLowerCase();
      this.filteredCategories.set(
        q ? this.allCategories.filter((c) => c.toLowerCase().includes(q)) : this.allCategories
      );
    });

    // Load locations
    this.locationService.getAll().subscribe((locs) => {
      this.allLocations = locs;
      this.filteredLocations.set(locs);
    });

    this.locationCtrl.valueChanges.pipe(startWith('')).subscribe((v) => {
      const q = (v || '').toLowerCase();
      this.filteredLocations.set(
        q ? this.allLocations.filter((l) => l.name.toLowerCase().includes(q)) : this.allLocations
      );
      if (typeof v === 'string' && v === '') {
        this.form.controls.locationId.setValue(null);
        if (this.form.value.status === 'IN_USE') {
          this.form.controls.status.setValue('AVAILABLE');
        }
      }
    });

    // Asset name autocomplete
    this.assetService.getAll().subscribe((assets) => {
      this.allAssets = assets;
      this.filteredAssets.set(assets);
    });
    this.form.get('name')!.valueChanges.pipe(startWith('')).subscribe((v) => {
      const q = (v || '').toLowerCase();
      this.filteredAssets.set(
        q ? this.allAssets.filter((a) => a.name.toLowerCase().includes(q)) : this.allAssets
      );
    });

    if (this.isEdit && this.assetId) {
      this.assetService.getById(this.assetId).subscribe((a) => {
        this.form.patchValue({
          name: a.name,
          serialNumber: a.serialNumber || '',
          status: a.status,
          purchaseDate: a.purchaseDate ? new Date(a.purchaseDate) : null,
          purchasePrice: a.purchasePrice ?? null,
          warrantyMonths: a.warrantyMonths ?? null,
          metrologyDate: a.metrologyDate ? new Date(a.metrologyDate) : null,
          metrologyExpiryDate: a.metrologyExpiryDate ? new Date(a.metrologyExpiryDate) : null,
          notes: a.notes || '',
          imageUrl: a.imageUrl || '',
        });
        if (a.category) this.categoryCtrl.setValue(a.category, { emitEvent: false });
        if (a.imageUrl) this.imagePreview.set(a.imageUrl);
        if (a.currentLocationId && a.currentLocationName) {
          this.form.controls.locationId.setValue(a.currentLocationId);
          this.locationCtrl.setValue(a.currentLocationName, { emitEvent: false });
        }
      });
    }
  }

  onNameSelected(event: MatAutocompleteSelectedEvent): void {
    const selected = this.allAssets.find((a) => a.name === event.option.value);
    if (selected?.category) this.categoryCtrl.setValue(selected.category, { emitEvent: false });
  }

  onCategoryKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    const value = (this.categoryCtrl.value || '').trim();
    if (!value) return;
    event.preventDefault();

    const exists = this.allCategories.some((c) => c.toLowerCase() === value.toLowerCase());
    if (exists) {
      this.snackBar.open(`Categoria "${value}" există deja.`, 'OK', { duration: 3000 });
      return;
    }
    this.categoryService.create(value).subscribe((name) => {
      this.allCategories = [...this.allCategories, name].sort();
      this.filteredCategories.set(this.allCategories);
      this.categoryCtrl.setValue(name, { emitEvent: false });
      this.snackBar.open(`Categoria "${name}" a fost adăugată.`, '', { duration: 2000 });
    });
  }

  onLocationSelected(event: MatAutocompleteSelectedEvent): void {
    const loc = event.option.value as Location;
    this.form.controls.locationId.setValue(loc.id);
    this.locationCtrl.setValue(loc.name, { emitEvent: false });
    this.form.controls.status.setValue('IN_USE');
  }

  clearLocation(): void {
    this.form.controls.locationId.setValue(null);
    this.locationCtrl.setValue('');
    this.form.controls.status.setValue('AVAILABLE');
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
    this.uploading.set(true);
    this.assetService.uploadImage(file).subscribe({
      next: (res) => { this.form.patchValue({ imageUrl: res.url }); this.uploading.set(false); },
      error: () => { this.error = 'Image upload failed.'; this.uploading.set(false); },
    });
  }

  removeImage(): void {
    this.imagePreview.set('');
    this.form.patchValue({ imageUrl: '' });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const raw = this.form.value;
    const request = {
      name: raw.name!,
      serialNumber: raw.serialNumber || undefined,
      category: this.categoryCtrl.value || undefined,
      status: raw.status as AssetStatus,
      purchaseDate: toLocalDateString(raw.purchaseDate ?? undefined),
      purchasePrice: raw.purchasePrice ?? undefined,
      warrantyMonths: raw.warrantyMonths ?? undefined,
      metrologyDate: toLocalDateString(raw.metrologyDate ?? undefined),
      metrologyExpiryDate: toLocalDateString(raw.metrologyExpiryDate ?? undefined),
      notes: raw.notes || undefined,
      imageUrl: raw.imageUrl || undefined,
      locationId: raw.locationId ?? undefined,
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
