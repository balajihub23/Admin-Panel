import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  login(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/auth/login`, payload).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  refreshToken(refreshToken: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/auth/refresh`, { refreshToken }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<any>(`${this.baseUrl}/api/v1/auth/logout`, { refreshToken }).pipe(
      tap({
        next: () => this.clearSession(),
        error: () => this.clearSession()
      })
    );
  }

  private setSession(authData: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('userRole', authData.role);
      localStorage.setItem('userFullName', authData.user.fullName);
      localStorage.setItem('userPhone', authData.user.phone);
      localStorage.setItem('userEmail', authData.user.email || '');
      localStorage.setItem('userMenus', JSON.stringify(authData.menus || []));
    }
  }

  clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  }

  isLoggedIn(): boolean {
    return typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
  }

  getAccessToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  }

  getRefreshToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
  }

  getUserRole(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  }

  getUserFullName(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('userFullName') : null;
  }
}
