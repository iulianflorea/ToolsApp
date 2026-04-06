import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/categories';

  getAll(): Observable<string[]> {
    return this.http.get<string[]>(this.base);
  }

  create(name: string): Observable<string> {
    return this.http.post<string>(this.base, { name });
  }
}
