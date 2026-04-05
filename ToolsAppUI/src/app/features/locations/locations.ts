import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIf } from '@angular/common';
import { LocationService } from '../../core/services/location.service';
import { ScreenService } from '../../core/services/screen.service';
import { Location, LocationType, LocationRequest } from '../../core/models/models';

@Component({
  selector: 'app-locations',
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
    NgIf,
  ],
  templateUrl: './locations.html',
  styleUrl: './locations.scss',
})
export class LocationsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly locationService = inject(LocationService);
  readonly screen = inject(ScreenService);

  locations = signal<Location[]>([]);
  showForm = signal(false);
  editingId = signal<number | null>(null);

  displayedColumns = ['name', 'address', 'type', 'active', 'actions'];
  locationTypes: LocationType[] = ['WAREHOUSE', 'JOB_SITE', 'OFFICE'];

  form = this.fb.group({
    name: ['', Validators.required],
    address: [''],
    type: [null as LocationType | null, Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.locationService.getAll().subscribe((data) => this.locations.set(data));
  }

  openForm(location?: Location): void {
    if (location) {
      this.editingId.set(location.id);
      this.form.patchValue({ name: location.name, address: location.address || '', type: location.type });
    } else {
      this.editingId.set(null);
      this.form.reset();
    }
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  save(): void {
    if (this.form.invalid) return;
    const request = this.form.value as LocationRequest;
    const obs = this.editingId()
      ? this.locationService.update(this.editingId()!, request)
      : this.locationService.create(request);

    obs.subscribe(() => { this.cancel(); this.load(); });
  }

  delete(id: number): void {
    if (!confirm('Deactivate this location?')) return;
    this.locationService.delete(id).subscribe(() => this.load());
  }

  typeLabel(t: LocationType): string {
    return t.replace('_', ' ');
  }
}
