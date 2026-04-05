import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Asset, AssetRequest, AssetStatus } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly API = '/api/assets';

  constructor(private http: HttpClient) {}

  getAll(status?: AssetStatus, category?: string, q?: string): Observable<Asset[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (category) params = params.set('category', category);
    if (q) params = params.set('q', q);
    return this.http.get<Asset[]>(this.API, { params });
  }

  getById(id: number): Observable<Asset> {
    return this.http.get<Asset>(`${this.API}/${id}`);
  }

  getByQrCode(qrCode: string): Observable<Asset> {
    return this.http.get<Asset>(`${this.API}/qr/${qrCode}`);
  }

  create(request: AssetRequest): Observable<Asset> {
    return this.http.post<Asset>(this.API, request);
  }

  update(id: number, request: AssetRequest): Observable<Asset> {
    return this.http.put<Asset>(`${this.API}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
