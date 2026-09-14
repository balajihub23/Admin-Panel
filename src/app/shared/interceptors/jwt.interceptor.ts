import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  
  // Avoid intercepting auth requests directly
  if (req.url.includes('/api/v1/auth/login') || 
      req.url.includes('/api/v1/auth/send-otp') || 
      req.url.includes('/api/v1/auth/verify-otp') || 
      req.url.includes('/api/v1/auth/refresh')) {
    return next(req);
  }

  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  let authReq = req;

  if (accessToken) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const http = inject(HttpClient);

          if (!isRefreshing) {
            isRefreshing = true;
            refreshTokenSubject.next(null);

            return http.post<any>(`${environment.serverApi}/api/v1/auth/refresh`, { refreshToken }).pipe(
              switchMap((response: any) => {
                isRefreshing = false;
                if (response.success && response.data) {
                  localStorage.setItem('accessToken', response.data.accessToken);
                  localStorage.setItem('refreshToken', response.data.refreshToken);
                  refreshTokenSubject.next(response.data.accessToken);
                  
                  const retryReq = req.clone({
                    setHeaders: {
                      Authorization: `Bearer ${response.data.accessToken}`
                    }
                  });
                  return next(retryReq);
                } else {
                  localStorage.clear();
                  router.navigate(['/service-error'], { queryParams: { code: '401', title: 'Session Expired', message: 'Your session has expired. Please log in again.' } });
                  return throwError(() => error);
                }
              }),
              catchError((refreshErr) => {
                isRefreshing = false;
                localStorage.clear();
                router.navigate(['/service-error'], { queryParams: { code: '401', title: 'Session Expired', message: 'Unable to refresh session. Please log in again.' } });
                return throwError(() => refreshErr);
              })
            );
          } else {
            // Queue concurrent requests and wait for the refreshed access token
            return refreshTokenSubject.pipe(
              filter(token => token !== null),
              take(1),
              switchMap((newAccessToken) => {
                const retryReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newAccessToken}`
                  }
                });
                return next(retryReq);
              })
            );
          }
        } else {
          localStorage.clear();
          router.navigate(['/service-error'], { queryParams: { code: '401', title: 'Unauthorized Access', message: 'Authentication token missing or invalid. Please log in.' } });
        }
      } else if ((error.status === 503 || error.status === 0) && typeof window !== 'undefined') {
        router.navigate(['/service-error'], { queryParams: { code: '503', title: 'Service Down', message: 'Rentron backend service is currently unreachable.' } });
      }
      return throwError(() => error);
    })
  );
};
