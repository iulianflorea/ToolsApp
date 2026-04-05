import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MaintenanceRecord, MaintenanceRequest, MaintenanceStatus } from '../models/models';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private readonly API = '/api/maintenance';

  constructor(private http: HttpClient) {}

  getAll(status?: MaintenanceStatus, assetId?: number): Observable<MaintenanceRecord[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (assetId) params = params.set('assetId', assetId);
    return this.http.get<MaintenanceRecord[]>(this.API, { params });
  }

  create(request: MaintenanceRequest): Observable<MaintenanceRecord> {
    return this.http.post<MaintenanceRecord>(this.API, request);
  }

  update(id: number, request: MaintenanceRequest): Observable<MaintenanceRecord> {
    return this.http.put<MaintenanceRecord>(`${this.API}/${id}`, request);
  }

  complete(id: number): Observable<MaintenanceRecord> {
    return this.http.put<MaintenanceRecord>(`${this.API}/${id}/complete`, {});
  }
}
