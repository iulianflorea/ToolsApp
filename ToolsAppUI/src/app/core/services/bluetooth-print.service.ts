import { Injectable, signal } from '@angular/core';
import QRCode from 'qrcode';

const PRINTER_SERVICES = [
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',  // Niimbot B1 native
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',  // ISSC transparent UART
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e',  // Nordic UART
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000ae30-0000-1000-8000-00805f9b34fb',
];

const ROW_DELAY       = 20;   // ms between bitmap rows
const ROW_CHUNK       = 30;   // rows to send before a longer pause
const ROW_CHUNK_PAUSE = 200;  // ms after each chunk
const CMD_TIMEOUT     = 3000; // ms to wait for printer response

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const toHex = (arr: Uint8Array) =>
  Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join(' ');

// Niimbot packet: 55 55 [cmd] [len] [data...] [checksum] AA AA
const makePkt = (cmd: number, data: number[]): Uint8Array => {
  let crc = cmd ^ data.length;
  for (const b of data) crc ^= b;
  return new Uint8Array([0x55, 0x55, cmd, data.length, ...data, crc, 0xAA, 0xAA]);
};

@Injectable({ providedIn: 'root' })
export class BluetoothPrintService {
  readonly supported  = 'bluetooth' in (navigator as any);
  readonly connected  = signal(false);
  readonly deviceName = signal('');
  readonly busy       = signal(false);
  readonly error      = signal('');

  private device?: any;
  private writeChar_?: any;
  private notifyChar_?: any;

  // Pending response resolver for request-response pattern
  private pendingResolve?: (resp: Uint8Array) => void;
  private pendingTimer?: any;

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
        this.writeChar_  = undefined;
        this.notifyChar_ = undefined;
      });

      const server = await this.device!.gatt!.connect();
      const result = await this.findChars(server);

      if (!result.write) {
        throw new Error('Nu am găsit o caracteristică de scriere pe acest dispozitiv.');
      }

      this.writeChar_  = result.write;
      this.notifyChar_ = result.notify;

      // Subscribe to notifications — required for request-response flow
      if (this.notifyChar_) {
        try {
          await this.notifyChar_.startNotifications();
          this.notifyChar_.addEventListener('characteristicvaluechanged',
            (e: any) => this.onNotify(e));
          console.log('[BT] Subscribed to notify char:', this.notifyChar_.uuid);
        } catch (e) {
          console.warn('[BT] Could not subscribe to notifications:', (e as any)?.message);
        }
      }

      this.connected.set(true);
      this.deviceName.set(this.device!.name || 'Imprimantă BT');
      console.log('[BT] Connected. Write:', result.write?.uuid, '| Notify:', result.notify?.uuid ?? 'none');
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
    this.writeChar_  = undefined;
    this.notifyChar_ = undefined;
  }

  // ── Notification handler ──────────────────────────────────────────────────

  private onNotify(event: any): void {
    const bytes = new Uint8Array((event.target as any).value.buffer);
    console.log('[BT] ← Response:', toHex(bytes));

    if (this.pendingResolve) {
      clearTimeout(this.pendingTimer);
      this.pendingResolve(bytes);
      this.pendingResolve = undefined;
      this.pendingTimer   = undefined;
    }
  }

  // ── Send command and wait for printer's response (or timeout) ─────────────

  private sendCmd(pkt: Uint8Array, label: string): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve) => {
      console.log('[BT] → ' + label + ':', toHex(pkt));

      // Set up response listener first
      this.pendingResolve = resolve;
      this.pendingTimer   = setTimeout(() => {
        // Timeout — no response received; continue anyway
        console.warn('[BT] Timeout waiting for response to', label);
        this.pendingResolve = undefined;
        this.pendingTimer   = undefined;
        resolve(new Uint8Array());
      }, CMD_TIMEOUT);

      this.writeRaw(pkt, false).catch(err => {
        clearTimeout(this.pendingTimer);
        this.pendingResolve = undefined;
        this.pendingTimer   = undefined;
        console.error('[BT] Write error for', label, err?.message);
        resolve(new Uint8Array());
      });
    });
  }

  // ── Query all GET_INFO fields for diagnostics ─────────────────────────────

  async probeInfo(): Promise<void> {
    if (!this.writeChar_ || !this.notifyChar_) {
      console.warn('[BT] Not connected'); return;
    }
    for (let p = 1; p <= 15; p++) {
      const pkt  = makePkt(0x40, [p]);
      const resp = await this.sendCmd(pkt, 'GET_INFO[' + p + ']');
      const data = resp.slice(4, resp.length - 3);
      const valU16 = data.length >= 2 ? (data[0] << 8) | data[1] : data[0] ?? -1;
      console.log('[BT] GET_INFO[' + p + ']: raw=' + toHex(data) + ' u16=' + valU16);
    }
  }

  // ── Print ──────────────────────────────────────────────────────────────────

  async printQr(code: string, _label: string, sizeMm: number, invertBitmap = false): Promise<void> {
    if (!this.writeChar_) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const { setup, rows, teardown } = this.buildNiimbotPackets(code, sizeMm, invertBitmap);
      console.log('[BT] Print start — setup=' + setup.length + ' rows=' + rows.length
                  + ' dots=' + Math.round(sizeMm * 8) + ' invert=' + invertBitmap);

      // ── Setup: with notify → await ACK; without notify → fire fast ──────────
      const setupLabels = [
        'SET_LABEL_TYPE',
        'SET_LABEL_DENSITY',
        'START_PRINT',
        'START_PAGE_PRINT',
        'SET_DIMENSION',
        'SET_QUANTITY',
      ];
      const hasNotify = !!this.notifyChar_;
      console.log('[BT] Notify available:', hasNotify);
      for (let i = 0; i < setup.length; i++) {
        const label = setupLabels[i] ?? 'CMD_' + i;
        if (hasNotify) {
          const resp = await this.sendCmd(setup[i], label);
          if (resp.length === 0) {
            console.warn('[BT] No response for', label, '— continuing');
          } else {
            const dataOk = resp.length >= 6 && resp[4] === 0x01;
            console.log('[BT]', label, 'ack:', dataOk ? 'OK' : 'FAIL', '| raw:', toHex(resp));
          }
        } else {
          // No notify char — fire and forget with small inter-command delay
          console.log('[BT] → ' + label + ':', toHex(setup[i]));
          await this.writeRaw(setup[i], false);
          await sleep(80);
        }
      }

      // ── Send raw pixel bytes — no Niimbot framing, no row header ──────────────
      // Packet layout: [55 55 cmd len | row_hi row_lo repeat_hi repeat_lo | pixelData... | crc AA AA]
      //                                  4 bytes header ──────────────────────
      // Raw mode: send ONLY pixelData (slice from byte 8, skip last 3)
      console.log('[BT] Sending', rows.length, 'raw pixel rows...');
      console.log('[BT] Raw row 0 (first 16 bytes):', toHex(rows[0].slice(8, 24)));
      for (let i = 0; i < rows.length; i++) {
        const raw = rows[i].slice(8, rows[i].length - 3);  // only pixel bytes
        await this.writeRaw(raw, false);
        if ((i + 1) % ROW_CHUNK === 0) {
          console.log('[BT] Row chunk', Math.ceil((i + 1) / ROW_CHUNK), '— pause');
          await sleep(ROW_CHUNK_PAUSE);
        }
      }
      await sleep(800);

      // ── Teardown ──────────────────────────────────────────────────────────────
      if (hasNotify) {
        await this.sendCmd(teardown[0], 'END_PAGE_PRINT');
        await this.sendCmd(teardown[1], 'END_PRINT');
      } else {
        console.log('[BT] → END_PAGE_PRINT:', toHex(teardown[0]));
        await this.writeRaw(teardown[0], false);
        await sleep(80);
        console.log('[BT] → END_PRINT:', toHex(teardown[1]));
        await this.writeRaw(teardown[1], false);
      }

      console.log('[BT] Print sequence complete');
    } catch (err: any) {
      this.error.set(err?.message ?? 'Eroare la printare.');
      console.error('[BT] Print error:', err);
    } finally {
      this.busy.set(false);
    }
  }

  // ── BLE write (raw) ────────────────────────────────────────────────────────

  private async writeRaw(data: Uint8Array, noResponse: boolean): Promise<void> {
    const char = this.writeChar_!;
    const canNoResp = char.properties?.writeWithoutResponse
                   && typeof char.writeValueWithoutResponse === 'function';
    const canResp   = typeof char.writeValueWithResponse === 'function';

    if (noResponse && canNoResp) {
      await char.writeValueWithoutResponse(data);
    } else if (canResp) {
      await char.writeValueWithResponse(data);
    } else {
      await char.writeValue(data);
    }
  }

  // ── Find write + notify characteristics ───────────────────────────────────

  private async findChars(server: any): Promise<{ write?: any; notify?: any }> {
    // 1. Niimbot B1 / D11 / B21 native service — enumerate ALL chars for diagnostics
    try {
      const svc   = await server.getPrimaryService('e7810a71-73ae-499d-8c15-faa9aef0c3f2');
      const chars = await svc.getCharacteristics();
      console.log('[BT] e7810a71 characteristics:');
      let writeCand: any;
      let notifyCand: any;
      for (const c of chars) {
        const props = [
          c.properties.read        ? 'read'    : '',
          c.properties.write       ? 'write'   : '',
          c.properties.writeWithoutResponse ? 'wwr' : '',
          c.properties.notify      ? 'notify'  : '',
          c.properties.indicate    ? 'indicate': '',
        ].filter(Boolean).join('|');
        console.log('[BT]  ', c.uuid, '->', props);
        if ((c.properties.write || c.properties.writeWithoutResponse) && !writeCand)  writeCand  = c;
        if ((c.properties.notify || c.properties.indicate)             && !notifyCand) notifyCand = c;
      }
      console.log('[BT] Using Niimbot native service → write:', writeCand?.uuid, '| notify:', notifyCand?.uuid ?? 'none');
      return { write: writeCand, notify: notifyCand };
    } catch (e) { console.log('[BT] Niimbot native failed:', (e as any)?.message); }

    // 2. ISSC transparent UART — TX (app→printer) + RX (printer→app)
    try {
      const svc    = await server.getPrimaryService('49535343-fe7d-4ae5-8fa9-9fafd205e455');
      const write  = await svc.getCharacteristic('49535343-8841-43f4-a8d4-ecbe34729bb3');
      let notify: any;
      try { notify = await svc.getCharacteristic('49535343-1e4d-4bd9-ba61-23c647249616'); } catch (_) {}
      console.log('[BT] Using ISSC UART service');
      return { write, notify };
    } catch (e) { console.log('[BT] ISSC failed:', (e as any)?.message); }

    // 3. Nordic UART
    try {
      const svc    = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
      const write  = await svc.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e');
      let notify: any;
      try { notify = await svc.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e'); } catch (_) {}
      console.log('[BT] Using Nordic UART service');
      return { write, notify };
    } catch (e) { console.log('[BT] Nordic UART failed:', (e as any)?.message); }

    // 4. Fallback: scan all services
    const services = await server.getPrimaryServices();
    console.log('[BT] Scanning services:', services.map((s: any) => s.uuid).join(', '));

    let writeCand: any;
    let notifyCand: any;

    for (const service of services) {
      try {
        const chars = await service.getCharacteristics();
        for (const c of chars) {
          const canWrite = c.properties.write || c.properties.writeWithoutResponse;
          const canNotify = c.properties.notify || c.properties.indicate;
          console.log('[BT]  char', c.uuid,
            'write=' + c.properties.write,
            'wwr=' + c.properties.writeWithoutResponse,
            'notify=' + c.properties.notify);
          if (canWrite && !writeCand)   writeCand  = c;
          if (canNotify && !notifyCand) notifyCand = c;
        }
      } catch (e) {
        console.warn('[BT] Service error', service.uuid, (e as any)?.message);
      }
    }

    console.log('[BT] Fallback write:', writeCand?.uuid, '| notify:', notifyCand?.uuid);
    return { write: writeCand, notify: notifyCand };
  }

  // ── Niimbot protocol builder ───────────────────────────────────────────────

  private buildNiimbotPackets(
    code: string, sizeMm: number, invertBitmap = false
  ): { setup: Uint8Array[]; rows: Uint8Array[]; teardown: Uint8Array[] } {

    const qr      = (QRCode as any).create(code, { errorCorrectionLevel: 'M' });
    const modules = qr.modules.data as Uint8ClampedArray;
    const modSize = qr.modules.size as number;

    // Physical label width = 50mm (5cm label) = 400 dots
    const LABEL_WIDTH_DOTS = 400;

    // QR code size in dots — capped at label width
    const qrDots   = Math.min(Math.round(sizeMm * 8), LABEL_WIDTH_DOTS);
    const scale    = qrDots / modSize;
    const rowBytes = Math.ceil(LABEL_WIDTH_DOTS / 8);   // 30 bytes per row
    const xOffset  = Math.floor((LABEL_WIDTH_DOTS - qrDots) / 2);

    console.log('[BT] LABEL_WIDTH=' + LABEL_WIDTH_DOTS + ' qrDots=' + qrDots
                + ' xOffset=' + xOffset + ' rowBytes=' + rowBytes);

    const hi = (n: number) => (n >> 8) & 0xFF;
    const lo = (n: number) =>  n       & 0xFF;

    // 1-bit bitmap: full label width, QR centered horizontally
    const bitmapRows: Uint8Array[] = [];
    for (let y = 0; y < qrDots; y++) {
      const row = new Uint8Array(rowBytes);  // all white
      const my  = Math.floor(y / scale);
      for (let x = 0; x < qrDots; x++) {
        const dark  = !!modules[my * modSize + Math.floor(x / scale)];
        const print = invertBitmap ? !dark : dark;
        if (print) {
          const px = x + xOffset;
          row[Math.floor(px / 8)] |= 0x80 >> (px % 8);
        }
      }
      bitmapRows.push(row);
    }

    const setup: Uint8Array[] = [
      makePkt(0x23, [0x01]),                                                          // SET_LABEL_TYPE: gap
      makePkt(0x21, [0x03]),                                                          // SET_LABEL_DENSITY: medium
      makePkt(0x01, [0x01]),                                                          // START_PRINT
      makePkt(0x03, [0x01]),                                                          // START_PAGE_PRINT
      makePkt(0x13, [hi(qrDots), lo(qrDots), hi(LABEL_WIDTH_DOTS), lo(LABEL_WIDTH_DOTS)]), // SET_DIMENSION [height, width]
      makePkt(0x15, [0x00, 0x01]),                                                    // SET_QUANTITY: 1
    ];

    const rows: Uint8Array[] = bitmapRows.map((row, y) =>
      makePkt(0x83, [hi(y), lo(y), 0x00, 0x01, ...Array.from(row)])
    );
    console.log('[BT] Row 0 sample:', toHex(rows[0].slice(0, 16)), '...');

    const teardown: Uint8Array[] = [
      makePkt(0xE3, [0x01]),  // END_PAGE_PRINT
      makePkt(0xF3, [0x01]),  // END_PRINT
    ];

    return { setup, rows, teardown };
  }
}
