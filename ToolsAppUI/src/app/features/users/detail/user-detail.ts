import {
  Component, OnInit,
  signal, inject, ElementRef, ViewChild
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgIf, NgClass, DatePipe, UpperCasePipe } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { QrPrintService, PRINT_SIZES, PrintSize } from '../../../core/services/qr-print.service';
import { BluetoothPrintService } from '../../../core/services/bluetooth-print.service';
import { AppUser, UserRole } from '../../../core/models/models';
import QRCode from 'qrcode';

@Component({
  selector: 'app-user-detail',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    NgIf,
    NgClass,
    DatePipe,
    UpperCasePipe,
  ],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.scss',
})
export class UserDetailComponent implements OnInit {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly qrPrint = inject(QrPrintService);
  readonly bt = inject(BluetoothPrintService);

  user = signal<AppUser | null>(null);
  editing = signal(false);
  saving = signal(false);

  printSizes = PRINT_SIZES;
  selectedPrintSize = signal<PrintSize>(PRINT_SIZES[4]); // 29mm default

  roles: UserRole[] = ['ADMIN', 'MANAGER', 'WORKER'];

  form = this.fb.group({
    fullName: ['', Validators.required],
    password: [''],
    role: ['WORKER' as UserRole, Validators.required],
  });

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.userService.getById(id).subscribe((u) => {
      this.user.set(u);
      if (u.qrCode) setTimeout(() => this.drawQr(u.qrCode!), 200);
    });
  }

  private drawQr(code: string): void {
    if (this.qrCanvas?.nativeElement) {
      QRCode.toCanvas(this.qrCanvas.nativeElement, code, { width: 220, margin: 2 });
    }
  }

  startEdit(): void {
    const u = this.user()!;
    this.form.patchValue({ fullName: u.fullName, role: u.role, password: '' });
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.form.reset();
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.value;
    this.saving.set(true);
    this.userService.update(this.user()!.id, {
      email: this.user()!.email,
      fullName: raw.fullName!,
      password: raw.password || undefined,
      role: raw.role!,
    }).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.editing.set(false);
        this.saving.set(false);
        if (updated.qrCode) setTimeout(() => this.drawQr(updated.qrCode!), 200);
      },
      error: () => this.saving.set(false),
    });
  }

  printQr(): void {
    const u = this.user();
    if (u?.qrCode) {
      this.qrPrint.print(u.qrCode, u.fullName, this.selectedPrintSize().mm);
    }
  }

  async printBt(): Promise<void> {
    const u = this.user();
    if (u?.qrCode) {
      await this.bt.printQr(u.qrCode, u.fullName, this.selectedPrintSize().mm);
    }
  }

  deactivate(): void {
    if (!confirm('Dezactivezi acest utilizator?')) return;
    this.userService.delete(this.user()!.id).subscribe(() => {
      this.router.navigate(['/users']);
    });
  }
}
