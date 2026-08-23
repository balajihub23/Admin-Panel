import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PartnerService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  getPartners(type: string = 'ALL'): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/partners?type=${type}`);
  }

  getVerificationQueue(status?: string, date?: string): Observable<any> {
    let q = '';
    if (status || date) {
      const p: string[] = [];
      if (status) p.push(`status=${status}`);
      if (date) p.push(`date=${date}`);
      q = '?' + p.join('&');
    }
    return this.http.get<any>(`${this.baseUrl}/api/v1/partners/verification-queue${q}`);
  }

  registerPartner(partnerData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/partners`, partnerData);
  }

  approvePartner(id: number, type: string = 'DRIVER'): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/partners/${id}/approve?type=${type}`, {});
  }

  rejectPartner(id: number, type: string = 'DRIVER'): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/partners/${id}/reject?type=${type}`, {});
  }

  assignDriverToContractor(driverId: number, contractorId?: number | null): Observable<any> {
    const params = contractorId ? `?driverId=${driverId}&contractorId=${contractorId}` : `?driverId=${driverId}`;
    return this.http.post<any>(`${this.baseUrl}/api/v1/partners/assign-driver${params}`, {});
  }
}
