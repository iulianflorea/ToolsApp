import {
  Component, Input, OnChanges, ViewChild, ElementRef, AfterViewInit
} from '@angular/core';
import { LabelConfig } from '../../core/models/printer.models';
import * as QRCode from 'qrcode';

const SCALE = 6; // px per mm

@Component({
  selector: 'app-label-preview',
  standalone: true,
  template: `
    <canvas #previewCanvas
      style="border: 1px solid #ccc; border-radius: 4px; background: white; display: block;">
    </canvas>
  `
})
export class LabelPreviewComponent implements OnChanges, AfterViewInit {
  @Input() config!: LabelConfig;
  @Input() qrCode: string = 'PREVIEW';
  @Input() labelText: string = '';
  @Input() serialNumber: string = '';

  @ViewChild('previewCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderPending = false;

  ngAfterViewInit(): void { this.renderPreview(); }

  ngOnChanges(): void {
    if (!this.renderPending) {
      this.renderPending = true;
      requestAnimationFrame(() => {
        this.renderPending = false;
        this.renderPreview();
      });
    }
  }

  private async renderPreview(): Promise<void> {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.config) return;

    canvas.width  = this.config.labelWidthMm  * SCALE;
    canvas.height = this.config.labelHeightMm * SCALE;

    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // ── QR code real ─────────────────────────────────────────────────────────
    const qrPx = Math.round(W * this.config.qrSizePercent / 100);
    const qrX  = Math.round(W * this.config.qrOffsetXPercent / 100);
    const qrY  = Math.round(H * this.config.qrOffsetYPercent / 100);

    try {
      const url = await QRCode.toDataURL(this.qrCode || 'PREVIEW', {
        width: qrPx, margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, qrX, qrY, qrPx, qrPx); resolve(); };
        img.onerror = () => resolve();
        img.src = url;
      });
    } catch { /* fallback gri */ }

    // ── Nume unealtă ─────────────────────────────────────────────────────────
    if (this.config.showName && this.labelText) {
      const nx  = W * this.config.nameOffsetXPercent / 100;
      const ny  = H * this.config.nameOffsetYPercent / 100;
      const fpx = Math.max(6, Math.round(this.config.nameFontSize * 0.45));
      ctx.fillStyle    = '#111111';
      ctx.font         = `600 ${fpx}px -apple-system, sans-serif`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      this.wrapText(ctx, this.labelText, nx, ny, W - nx - 4, fpx * 1.3);
    }

    // ── ID cod QR ─────────────────────────────────────────────────────────────
    if (this.config.showId && this.qrCode) {
      const ix  = W * this.config.idOffsetXPercent / 100;
      const iy  = H * this.config.idOffsetYPercent / 100;
      const fpx = Math.max(5, Math.round(this.config.idFontSize * 0.45));
      ctx.fillStyle    = '#555555';
      ctx.font         = `${fpx}px 'SF Mono', 'Courier New', monospace`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('ID:' + this.qrCode, ix, iy);
    }

    // ── Număr de serie ────────────────────────────────────────────────────────
    if (this.config.showSerial && this.serialNumber) {
      const sx  = W * this.config.serialOffsetXPercent / 100;
      const sy  = H * this.config.serialOffsetYPercent / 100;
      const fpx = Math.max(5, Math.round(this.config.serialFontSize * 0.45));
      ctx.fillStyle    = '#555555';
      ctx.font         = `${fpx}px 'SF Mono', 'Courier New', monospace`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('SN:' + this.serialNumber, sx, sy);
    }

    // ── Bordură etichetă ──────────────────────────────────────────────────────
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth   = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string, x: number, y: number,
    maxW: number, lineH: number
  ): void {
    const words = text.split(' ');
    let line = '';
    for (const w of words) {
      const candidate = line ? line + ' ' + w : w;
      if (ctx.measureText(candidate).width > maxW && line) {
        ctx.fillText(line, x, y); line = w; y += lineH;
      } else { line = candidate; }
    }
    if (line) ctx.fillText(line, x, y);
  }
}
