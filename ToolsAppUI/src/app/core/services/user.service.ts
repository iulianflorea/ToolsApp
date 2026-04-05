import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppUser, UserRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API = '/api/users';

  constructor(private http: HttpClient) {}

  getAll(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(this.API);
  }

  create(request: UserRequest): Observable<AppUser> {
    return this.http.post<AppUser>(this.API, request);
  }

  update(id: number, request: UserRequest): Observable<AppUser> {
    return this.http.put<AppUser>(`${this.API}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
