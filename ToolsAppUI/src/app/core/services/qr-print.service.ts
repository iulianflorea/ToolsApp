import { Injectable } from '@angular/core';
import QRCode from 'qrcode';

export interface PrintSize {
  label: string;
  mm: number;
}

export const PRINT_SIZES: PrintSize[] = [
  { label: '10 mm',  mm: 10  },
  { label: '15 mm',  mm: 15  },
  { label: '20 mm',  mm: 20  },
  { label: '25 mm',  mm: 25  },
  { label: '29 mm',  mm: 29  },
  { label: '38 mm',  mm: 38  },
  { label: '50 mm',  mm: 50  },
  { label: '62 mm',  mm: 62  },
  { label: '100 mm', mm: 100 },
];

@Injectable({ providedIn: 'root' })
export class QrPrintService {

  async print(code: string, name: string, sizeMm: number): Promise<void> {
    // Generate QR as data URL at high resolution (4× for print quality)
    const sizePx = Math.round(sizeMm * 3.7795 * 4);
    const dataUrl = await QRCode.toDataURL(code, {
      width: sizePx,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    const pageH = sizeMm + 14; // label text below QR

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: ${sizeMm}mm ${pageH}mm; margin: 0; }
    body {
      width: ${sizeMm}mm;
      padding: 1mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: Arial, Helvetica, sans-serif;
    }
    img  { width: ${sizeMm - 2}mm; height: ${sizeMm - 2}mm; display: block; }
    .lbl { font-size: 7pt; text-align: center; margin-top: 1.5mm;
           max-width: ${sizeMm - 2}mm; word-break: break-word; line-height: 1.3; }
  </style>
</head>
<body>
  <img src="${dataUrl}" alt="QR"/>
  <div class="lbl">${name}</div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  <\/script>
</body>
</html>`;

    const win = window.open('', '_blank', `width=${sizeMm * 4},height=${pageH * 4}`);
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }
}
