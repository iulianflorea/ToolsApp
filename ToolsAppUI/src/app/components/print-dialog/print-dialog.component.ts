import { Component, DestroyRef, Inject, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { debounceTime, switchMap } from 'rxjs/operators';
import { PrinterService } from '../../core/services/printer.service';
import { TranslationService } from '../../core/services/translation.service';
import { DEFAULT_LABEL_CONFIG, LabelConfig, PrinterInfo } from '../../core/models/printer.models';
import { LabelPreviewComponent } from '../label-preview/label-preview.component';

export interface PrintDialogData {
  qrCode: string;
  assetName: string;
  serialNumber?: string;
}

@Component({
  selector: 'app-print-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    LabelPreviewComponent,
    TranslatePipe,
  ],
  templateUrl: './print-dialog.component.html',
  styleUrls: ['./print-dialog.component.scss']
})
export class PrintDialogComponent implements OnInit {

  activeTab = 0;

  config: LabelConfig = { ...DEFAULT_LABEL_CONFIG };

  customLabelText = '';

  printers: PrinterInfo[] = [];
  selectedPrinter: PrinterInfo | null = null;
  loadingPrinters = false;
  printing = false;
  printSuccess = false;
  printError = '';

  private readonly configChange$ = new Subject<LabelConfig>();
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PrintDialogData,
    private dialogRef: MatDialogRef<PrintDialogComponent>,
    private printerService: PrinterService,
    private ts: TranslationService
  ) {}

  ngOnInit(): void {
    this.customLabelText = this.data.assetName;

    this.printerService.getLabelConfig().subscribe({
      next: (c) => { this.config = c; },
      error: () => { this.config = { ...DEFAULT_LABEL_CONFIG }; }
    });

    this.configChange$.pipe(
      debounceTime(500),
      switchMap((cfg) => this.printerService.saveLabelConfig(cfg)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  onConfigChange(): void {
    this.config = { ...this.config };
    this.configChange$.next(this.config);
  }

  setTab(tab: number): void {
    if (tab === this.activeTab) return;
    this.activeTab = tab;
    if (tab === 1) this.loadPrinters();
  }

  loadPrinters(): void {
    this.loadingPrinters = true;
    this.printers = [];
    this.selectedPrinter = null;
    this.printerService.getPrinters().subscribe({
      next: (p) => { this.printers = p; this.loadingPrinters = false; },
      error: () => { this.loadingPrinters = false; }
    });
  }

  rescanPrinters(): void {
    this.printerService.clearPrinterCache().subscribe({
      next: () => this.loadPrinters(),
      error: () => this.loadPrinters()
    });
  }

  print(): void {
    if (!this.selectedPrinter) return;
    this.printing = true;
    this.printError = '';
    const printer = this.selectedPrinter;
    this.printerService.print({
      printerIp: printer.ip,
      printerPort: printer.port,
      qrCode: this.data.qrCode,
      labelText: this.customLabelText,
      serialText: this.data.serialNumber ?? '',
      ...this.config,
    }).subscribe({
      next: () => {
        this.printerService.saveLastPrinter(printer);
        this.printing = false;
        this.printSuccess = true;
        setTimeout(() => this.dialogRef.close(), 1500);
      },
      error: (e) => {
        this.printing = false;
        this.printError = e.error || this.ts.t('print.printError');
      }
    });
  }

  close(): void {
    this.printerService.saveLabelConfig(this.config).subscribe();
    this.dialogRef.close();
  }
}
