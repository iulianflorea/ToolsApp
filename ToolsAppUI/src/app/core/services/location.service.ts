import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Location, LocationRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly API = '/api/locations';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Location[]> {
    return this.http.get<Location[]>(this.API);
  }

  create(request: LocationRequest): Observable<Location> {
    return this.http.post<Location>(this.API, request);
  }

  update(id: number, request: LocationRequest): Observable<Location> {
    return this.http.put<Location>(`${this.API}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
