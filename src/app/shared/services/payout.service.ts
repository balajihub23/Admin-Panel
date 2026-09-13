import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DriverWithdrawal {
  id: number;
  driverId: number;
  userId: number;
  bankAccountId?: number;
  bankAccountDetails?: string;
  driverName?: string;
  driverPhone?: string;
  amount: number;
  status: string; // PENDING, PROCESSED, REJECTED
  referenceNumber: string;
  adminRemarks?: string;
  requestedAt?: string;
  processedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PayoutService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  getPayouts(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/admin/payouts`);
  }

  processPayout(id: number, adminRemarks?: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/v1/admin/payouts/${id}/process`, { adminRemarks });
  }

  rejectPayout(id: number, adminRemarks?: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/v1/admin/payouts/${id}/reject`, { adminRemarks });
  }
}
