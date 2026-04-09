import {
  Component, Input, OnChanges, ViewChild, ElementRef, AfterViewInit
} from '@angular/core';
import { LabelConfig } from '../../core/models/printer.models';

@Component({
  selector: 'app-label-preview',
  standalone: true,
  template: `
    <canvas #previewCanvas
      [width]="canvasWidth"
      [height]="canvasHeight"
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

  private readonly SCALE = 6; // px per mm

  get canvasWidth():  number { return (this.config?.labelWidthMm  ?? 50) * this.SCALE; }
  get canvasHeight(): number { return (this.config?.labelHeightMm ?? 30) * this.SCALE; }

  ngAfterViewInit(): void { this.render(); }
  ngOnChanges():     void { setTimeout(() => this.render(), 0); }

  private drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number, y: number,
    maxWidth: number,
    lineHeight: number
  ): void {
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const candidate = line ? line + ' ' + word : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = word;
        y += lineHeight;
      } else {
        line = candidate;
      }
    }
    if (line) ctx.fillText(line, x, y);
  }

  private render(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.config) return;

    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;

    // ── Fundal alb ────────────────────────────────────────────────────────────
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, W, H);

    // ── QR placeholder ────────────────────────────────────────────────────────
    const qrSize = (W * this.config.qrSizePercent) / 100;
    const qrX    = (W * this.config.qrOffsetXPercent) / 100;
    const qrY    = (H * this.config.qrOffsetYPercent) / 100;

    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);

    // pattern QR simulat
    ctx.fillStyle = '#333';
    const cell = qrSize / 10;
    [[0,0],[0,2],[2,0],[0,6],[0,8],[2,8],[6,0],[8,0],[8,2],[6,8],[8,6],[8,8]].forEach(([r, c]) => {
      ctx.fillRect(qrX + c * cell + 1, qrY + r * cell + 1, cell - 1, cell - 1);
    });
    ctx.fillRect(qrX + cell,          qrY + cell,          cell * 2, cell * 2);
    ctx.fillRect(qrX + 6 * cell + 1,  qrY + cell,          cell * 2, cell * 2);
    ctx.fillRect(qrX + cell,          qrY + 6 * cell + 1,  cell * 2, cell * 2);

    // ── Nume unealtă (cu word wrap) ───────────────────────────────────────────
    if (this.config.showName && this.labelText) {
      const nameX  = (W * this.config.nameOffsetXPercent) / 100;
      const nameY  = (H * this.config.nameOffsetYPercent) / 100;
      const namePx = Math.max(6, Math.round(this.config.nameFontSize * 0.5));
      ctx.fillStyle    = '#111';
      ctx.font         = `600 ${namePx}px -apple-system, sans-serif`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      this.drawWrappedText(ctx, this.labelText, nameX, nameY, W - nameX, namePx * 1.3);
    }

    // ── ID cod QR ─────────────────────────────────────────────────────────────
    if (this.config.showId && this.qrCode) {
      const idX  = (W * this.config.idOffsetXPercent) / 100;
      const idY  = (H * this.config.idOffsetYPercent) / 100;
      const idPx = Math.max(5, Math.round(this.config.idFontSize * 0.5));
      ctx.fillStyle    = '#555';
      ctx.font         = `${idPx}px 'SF Mono', monospace`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('ID: ' + this.qrCode, idX, idY);
    }

    // ── Număr de serie ────────────────────────────────────────────────────────
    if (this.config.showSerial && this.serialNumber) {
      const snX  = (W * this.config.serialOffsetXPercent) / 100;
      const snY  = (H * this.config.serialOffsetYPercent) / 100;
      const snPx = Math.max(5, Math.round(this.config.serialFontSize * 0.5));
      ctx.fillStyle    = '#555';
      ctx.font         = `${snPx}px 'SF Mono', monospace`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('SN: ' + this.serialNumber, snX, snY);
    }

    // ── Bordură etichetă ─────────────────────────────────────────────────────
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  }
}
