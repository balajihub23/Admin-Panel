import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  getAccessibleMenus(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/menus`).pipe(
      tap(response => {
        if (response.success && response.data) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('userMenus', JSON.stringify(response.data));
          }
        }
      })
    );
  }

  getPrivileges(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/menus/privileges`);
  }
}
