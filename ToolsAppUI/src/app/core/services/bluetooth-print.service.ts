import { Injectable, signal } from '@angular/core';
import QRCode from 'qrcode';

// Common GATT service UUIDs for thermal/label printers
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ff01-0000-1000-8000-00805f9b34fb',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000fff1-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  '0000ae30-0000-1000-8000-00805f9b34fb',
  '0000af30-0000-1000-8000-00805f9b34fb',
];

const PACKET_DELAY = 20;   // ms between row BLE writes
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

@Injectable({ providedIn: 'root' })
export class BluetoothPrintService {
  readonly supported  = 'bluetooth' in (navigator as any);
  readonly connected  = signal(false);
  readonly deviceName = signal('');
  readonly busy       = signal(false);
  readonly error      = signal('');

  private device?: any;
  private characteristic?: any;

  // ── Connect ────────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    this.error.set('');
    try {
      this.device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      });

      this.device!.addEventListener('gattserverdisconnected', () => {
        this.connected.set(false);
        this.deviceName.set('');
        this.characteristic = undefined;
      });

      const server = await this.device!.gatt!.connect();
      this.characteristic = await this.findWritableCharacteristic(server);

      if (!this.characteristic) {
        throw new Error('Nu am găsit o caracteristică de scriere pe acest dispozitiv.');
      }

      this.connected.set(true);
      this.deviceName.set(this.device!.name || 'Imprimantă BT');
    } catch (err: any) {
      if (err?.name !== 'NotFoundError') {
        this.error.set(err?.message ?? 'Eroare conectare Bluetooth.');
      }
    }
  }

  disconnect(): void {
    this.device?.gatt?.disconnect();
    this.connected.set(false);
    this.deviceName.set('');
    this.characteristic = undefined;
  }

  // ── Print ──────────────────────────────────────────────────────────────────

  async printQr(code: string, _label: string, sizeMm: number): Promise<void> {
    if (!this.characteristic) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const { setup, rows, teardown } = this.buildNiimbotPackets(code, sizeMm);
      console.log('[BT] setup=' + setup.length + ' rows=' + rows.length);

      // Setup commands
      for (const pkt of setup) {
        await this.writeChar(pkt);
        await sleep(100);
      }

      // Bitmap rows — use writeValueWithResponse for reliability on Linux/BlueZ
      for (let i = 0; i < rows.length; i++) {
        try {
          await this.writeChar(rows[i]);
          await sleep(PACKET_DELAY);
        } catch (err: any) {
          console.error('[BT] Row ' + i + ' failed:', err?.message);
          throw err;
        }
      }

      await sleep(300);
      for (const pkt of teardown) {
        await this.writeChar(pkt);
        await sleep(100);
      }

      console.log('[BT] Done');
    } catch (err: any) {
      this.error.set(err?.message ?? 'Eroare la printare.');
    } finally {
      this.busy.set(false);
    }
  }

  // ── Find writable GATT characteristic ─────────────────────────────────────

  private async findWritableCharacteristic(server: any): Promise<any | undefined> {
    // 1. Try ISSC RX characteristic directly (Niimbot, many Chinese printers)
    try {
      const svc  = await server.getPrimaryService('49535343-fe7d-4ae5-8fa9-9fafd205e455');
      const char = await svc.getCharacteristic('49535343-1e4d-4bd9-ba61-23c647249616');
      console.log('[BT] Using ISSC RX char: 49535343-1e4d-4bd9-ba61-23c647249616');
      return char;
    } catch (e) {
      console.log('[BT] ISSC RX failed:', (e as any)?.message);
    }

    // 2. Try Nordic UART RX directly
    try {
      const svc  = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
      const char = await svc.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e');
      console.log('[BT] Using NUS RX char: 6e400002-b5a3-f393-e0a9-e50e24dcca9e');
      return char;
    } catch (e) {
      console.log('[BT] NUS RX failed:', (e as any)?.message);
    }

    // 3. Fallback: scan all services, prefer write-only over write+notify
    const services = await server.getPrimaryServices();
    console.log('[BT] Services found: ' + services.map((s: any) => s.uuid).join(', '));

    let rxCandidate: any | undefined;
    let txCandidate: any | undefined;

    for (const service of services) {
      try {
        const chars = await service.getCharacteristics();
        console.log('[BT] Svc ' + service.uuid + ': ' +
          chars.map((c: any) =>
            c.uuid + '[w=' + c.properties.write +
            ' wwr=' + c.properties.writeWithoutResponse +
            ' n=' + c.properties.notify + ']'
          ).join(' | ')
        );
        for (const c of chars) {
          const canWrite = c.properties.write || c.properties.writeWithoutResponse;
          if (!canWrite) continue;
          if (!c.properties.notify && !c.properties.indicate) {
            rxCandidate ??= c;
          } else {
            txCandidate ??= c;
          }
        }
      } catch (e) {
        console.warn('[BT] Service error ' + service.uuid + ': ' + (e as any)?.message);
      }
    }

    const selected = rxCandidate ?? txCandidate;
    console.log('[BT] Selected: ' + (selected?.uuid ?? 'none'));
    return selected;
  }

  // ── BLE write ─────────────────────────────────────────────────────────────

  private async writeChar(data: Uint8Array): Promise<void> {
    if (typeof this.characteristic!.writeValueWithResponse === 'function') {
      await this.characteristic!.writeValueWithResponse(data);
    } else {
      await this.characteristic!.writeValue(data);
    }
  }

  // ── Niimbot protocol builder ───────────────────────────────────────────────
  //
  // Packet: 0x55 0x55 [cmd] [len] [data…] [checksum] 0xAA 0xAA
  // Checksum = cmd XOR len XOR data[0] XOR … XOR data[n]

  private buildNiimbotPackets(code: string, sizeMm: number): {
    setup: Uint8Array[];
    rows: Uint8Array[];
    teardown: Uint8Array[];
  } {
    // 1. QR module matrix
    const qr      = (QRCode as any).create(code, { errorCorrectionLevel: 'M' });
    const modules: boolean[] = Array.from(qr.modules.data);
    const modSize = qr.modules.size as number;

    // 2. Scale to dots (203 DPI ≈ 8 dots/mm)
    const dots     = Math.round(sizeMm * 8);
    const scale    = dots / modSize;
    const rowBytes = Math.ceil(dots / 8);

    // 3. 1-bit bitmap rows
    const bitmapRows: Uint8Array[] = [];
    for (let y = 0; y < dots; y++) {
      const row = new Uint8Array(rowBytes);
      const my  = Math.floor(y / scale);
      for (let x = 0; x < dots; x++) {
        if (modules[my * modSize + Math.floor(x / scale)]) {
          row[Math.floor(x / 8)] |= 0x80 >> (x % 8);
        }
      }
      bitmapRows.push(row);
    }

    // 4. Packet factory
    const makePkt = (cmd: number, data: number[]): Uint8Array => {
      let crc = cmd ^ data.length;
      for (const b of data) crc ^= b;
      return new Uint8Array([0x55, 0x55, cmd, data.length, ...data, crc, 0xAA, 0xAA]);
    };
    const hi = (n: number) => (n >> 8) & 0xFF;
    const lo = (n: number) =>  n       & 0xFF;

    const setup: Uint8Array[] = [
      makePkt(0x23, [0x01]),                                     // SET_LABEL_TYPE: gap
      makePkt(0x21, [0x05]),                                     // SET_LABEL_DENSITY: max
      makePkt(0x01, [0x01]),                                     // START_PRINT
      makePkt(0x03, [0x01]),                                     // START_PAGE_PRINT
      makePkt(0x13, [hi(dots), lo(dots), hi(dots), lo(dots)]),   // SET_DIMENSION
      makePkt(0x15, [0x00, 0x01]),                               // SET_QUANTITY: 1
    ];

    const rows: Uint8Array[] = bitmapRows.map((row, y) =>
      makePkt(0x85, [hi(y), lo(y), ...Array.from(row)])          // PRINT_BITMAP_ROW
    );

    const teardown: Uint8Array[] = [
      makePkt(0xE3, [0x01]),   // END_PAGE_PRINT
      makePkt(0xF3, [0x01]),   // END_PRINT
    ];

    return { setup, rows, teardown };
  }
}
