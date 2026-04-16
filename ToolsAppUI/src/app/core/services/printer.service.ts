import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { DEFAULT_LABEL_CONFIG, LabelConfig, PrinterInfo, PrintRequest } from '../models/printer.models';

@Injectable({ providedIn: 'root' })
export class PrinterService {
  private api = '/api/printers';
  private readonly LAST_PRINTER_KEY = 'tt-last-printer';
  private readonly LABEL_CONFIG_KEY = 'tt-label-config';

  constructor(private http: HttpClient) {}

  getPrinters(): Observable<PrinterInfo[]> {
    return this.http.get<PrinterInfo[]>(this.api);
  }

  clearPrinterCache(): Observable<string> {
    return this.http.post(`${this.api}/clear-cache`, {}, { responseType: 'text' });
  }

  getLabelConfig(): Observable<LabelConfig> {
    const stored = localStorage.getItem(this.LABEL_CONFIG_KEY);
    const config: LabelConfig = stored
      ? { ...DEFAULT_LABEL_CONFIG, ...JSON.parse(stored) }
      : { ...DEFAULT_LABEL_CONFIG };
    return of(config);
  }

  saveLabelConfig(config: LabelConfig): Observable<LabelConfig> {
    localStorage.setItem(this.LABEL_CONFIG_KEY, JSON.stringify(config));
    return of(config);
  }

  print(request: PrintRequest): Observable<string> {
    return this.http.post(`${this.api}/print`, request, { responseType: 'text' });
  }

  getLastPrinter(): PrinterInfo | null {
    const stored = localStorage.getItem(this.LAST_PRINTER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  saveLastPrinter(printer: PrinterInfo): void {
    localStorage.setItem(this.LAST_PRINTER_KEY, JSON.stringify(printer));
  }
}
