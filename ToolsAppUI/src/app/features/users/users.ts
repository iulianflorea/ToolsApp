import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIf, NgClass, DatePipe } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { AppUser, UserRole } from '../../core/models/models';
import { ScreenService } from '../../core/services/screen.service';

@Component({
  selector: 'app-users',
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
    NgClass,
    DatePipe,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class UsersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  readonly screen = inject(ScreenService);

  users = signal<AppUser[]>([]);
  showForm = signal(false);
  editingId = signal<number | null>(null);

  displayedColumns = ['fullName', 'email', 'role', 'active', 'createdAt', 'actions'];
  roles: UserRole[] = ['ADMIN', 'MANAGER', 'WORKER'];

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    fullName: ['', Validators.required],
    role: ['WORKER' as UserRole, Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.userService.getAll().subscribe((u) => this.users.set(u));
  }

  openForm(user?: AppUser): void {
    if (user) {
      this.editingId.set(user.id);
      this.form.patchValue({ fullName: user.fullName, email: user.email, role: user.role, password: '' });
      this.form.get('email')?.disable();
    } else {
      this.editingId.set(null);
      this.form.reset({ role: 'WORKER' });
      this.form.get('email')?.enable();
    }
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
    this.form.get('email')?.enable();
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const request = { email: raw.email!, password: raw.password || undefined, fullName: raw.fullName!, role: raw.role! };

    const obs = this.editingId()
      ? this.userService.update(this.editingId()!, request)
      : this.userService.create(request);

    obs.subscribe(() => { this.cancel(); this.load(); });
  }

  deactivate(id: number): void {
    if (!confirm('Deactivate this user?')) return;
    this.userService.delete(id).subscribe(() => this.load());
  }
}
