export interface PrinterInfo {
  name: string;
  ip: string;
  port: number;
  discoveryMethod: 'mdns' | 'scan' | 'cache';
}

export interface LabelConfig {
  // Dimensiuni etichetă
  labelWidthMm: number;
  labelHeightMm: number;

  // Cod QR
  qrOffsetXPercent: number;
  qrOffsetYPercent: number;
  qrSizePercent: number;

  // Nume unealtă
  showName: boolean;
  nameOffsetXPercent: number;
  nameOffsetYPercent: number;
  nameFontSize: number;

  // ID cod QR
  showId: boolean;
  idOffsetXPercent: number;
  idOffsetYPercent: number;
  idFontSize: number;

  // Număr de serie
  showSerial: boolean;
  serialOffsetXPercent: number;
  serialOffsetYPercent: number;
  serialFontSize: number;

  // Gap între etichete (0 = folosește calibrarea stocată în imprimantă)
  gapMm: number;
}

export const DEFAULT_LABEL_CONFIG: LabelConfig = {
  labelWidthMm: 50,
  labelHeightMm: 30,
  qrOffsetXPercent: 5,
  qrOffsetYPercent: 5,
  qrSizePercent: 55,
  showName: true,
  nameOffsetXPercent: 38,
  nameOffsetYPercent: 20,
  nameFontSize: 20,
  showId: false,
  idOffsetXPercent: 38,
  idOffsetYPercent: 55,
  idFontSize: 16,
  showSerial: false,
  serialOffsetXPercent: 38,
  serialOffsetYPercent: 70,
  serialFontSize: 16,
  gapMm: 0,
};

export interface PrintRequest {
  printerIp: string;
  printerPort: number;
  qrCode: string;
  labelWidthMm: number;
  labelHeightMm: number;
  qrOffsetXPercent: number;
  qrOffsetYPercent: number;
  qrSizePercent: number;
  labelText: string;
  showName: boolean;
  nameOffsetXPercent: number;
  nameOffsetYPercent: number;
  nameFontSize: number;
  showId: boolean;
  idOffsetXPercent: number;
  idOffsetYPercent: number;
  idFontSize: number;
  serialText: string;
  showSerial: boolean;
  serialOffsetXPercent: number;
  serialOffsetYPercent: number;
  serialFontSize: number;
  gapMm: number;
}
