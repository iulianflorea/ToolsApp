import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LabelConfig, PrinterInfo, PrintRequest } from '../models/printer.models';

@Injectable({ providedIn: 'root' })
export class PrinterService {
  private api = '/api/printers';
  private readonly LAST_PRINTER_KEY = 'tt-last-printer';

  constructor(private http: HttpClient) {}

  getPrinters(): Observable<PrinterInfo[]> {
    return this.http.get<PrinterInfo[]>(this.api);
  }

  clearPrinterCache(): Observable<string> {
    return this.http.post(`${this.api}/clear-cache`, {}, { responseType: 'text' });
  }

  getLabelConfig(): Observable<LabelConfig> {
    return this.http.get<LabelConfig>(`${this.api}/label-config`);
  }

  saveLabelConfig(config: LabelConfig): Observable<LabelConfig> {
    return this.http.post<LabelConfig>(`${this.api}/label-config`, config);
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
