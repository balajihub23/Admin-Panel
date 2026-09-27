import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminNotification {
  id?: number;
  userId?: number;
  targetType?: string;
  notificationType?: string;
  title: string;
  message: string;
  deepLink?: string;
  isRead: boolean;
  createdAt?: string;
  timeAgo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  getMyNotifications(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/notifications/inbox`).pipe(
      catchError(err => {
        console.warn('Error fetching notifications from server:', err);
        return of({ success: false, data: [] });
      })
    );
  }

  getUnreadCount(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/notifications/unread-count`).pipe(
      catchError(() => of({ success: false, data: 0 }))
    );
  }

  markAsRead(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/notifications/mark-read/${id}`, {}).pipe(
      catchError(() => of({ success: true }))
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/notifications/mark-all-read`, {}).pipe(
      catchError(() => of({ success: true }))
    );
  }
}
