import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MenuAdminItem {
  id: number;
  menuName: string;
  menuCode: string;
  parentMenuId?: number | null;
  routePath?: string;
  icon?: string;
  displayOrder: number;
  active: boolean;
  createdAt?: string;
}

export interface MenuSaveRequest {
  id?: number;
  menuName: string;
  menuCode: string;
  parentMenuId?: number | null;
  routePath?: string;
  icon?: string;
  displayOrder: number;
  active: boolean;
}

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

  // ── Admin CRUD ──────────────────────────────────────────────────────────────
  getAllMenusAdmin(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/menus/all`);
  }

  saveMenu(menu: MenuSaveRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/menus`, menu);
  }

  deleteMenu(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/api/v1/menus/${id}`);
  }
}
