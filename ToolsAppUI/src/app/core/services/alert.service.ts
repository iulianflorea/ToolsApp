import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alert } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly API = '/api/alerts';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.API);
  }

  markRead(id: number): Observable<Alert> {
    return this.http.put<Alert>(`${this.API}/${id}/read`, {});
  }

  markAllRead(): Observable<void> {
    return this.http.put<void>(`${this.API}/read-all`, {});
  }
}
