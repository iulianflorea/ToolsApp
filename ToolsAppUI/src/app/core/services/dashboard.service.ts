import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryStats, DashboardStats } from '../models/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly API = '/api/dashboard';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API}/stats`);
  }

  getCategoryStats(): Observable<CategoryStats[]> {
    return this.http.get<CategoryStats[]>(`${this.API}/by-category`);
  }
}
