import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
          // Try executing silent token refresh rotation in background
          return http.post<any>(`${environment.serverApi}/api/v1/auth/refresh`, { refreshToken }).pipe(
            switchMap((response: any) => {
              if (response.success && response.data) {
                localStorage.setItem('accessToken', response.data.accessToken);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                
                // Clone original request and re-run with fresh token
                const retryReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${response.data.accessToken}`
                  }
                });
                return next(retryReq);
              } else {
                localStorage.clear();
                router.navigate(['/login']);
                return throwError(() => error);
              }
            }),
            catchError((refreshErr) => {
              localStorage.clear();
              router.navigate(['/login']);
              return throwError(() => refreshErr);
            })
          );
        } else {
          localStorage.clear();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
