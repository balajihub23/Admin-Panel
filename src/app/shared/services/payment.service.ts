import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  getAdminTransactions(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/payments/admin/transactions`);
  }

  updatePaymentStatus(bookingId: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/v1/payments/admin/transactions/${bookingId}/status?status=${status}`, {});
  }
}
