import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transfer, TransferRequest, TransferStatus } from '../models/models';

@Injectable({ providedIn: 'root' })
export class TransferService {
  private readonly API = '/api/transfers';

  constructor(private http: HttpClient) {}

  getAll(assetId?: number, userId?: number, status?: TransferStatus): Observable<Transfer[]> {
    let params = new HttpParams();
    if (assetId) params = params.set('assetId', assetId);
    if (userId) params = params.set('userId', userId);
    if (status) params = params.set('status', status);
    return this.http.get<Transfer[]>(this.API, { params });
  }

  create(request: TransferRequest): Observable<Transfer> {
    return this.http.post<Transfer>(this.API, request);
  }

  return(id: number): Observable<Transfer> {
    return this.http.put<Transfer>(`${this.API}/${id}/return`, {});
  }
}
