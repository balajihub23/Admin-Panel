import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Contractor {
  id?: number;
  userId?: number;
  fullName: string;
  phone: string;
  email?: string;
  companyName?: string;
  gstNumber?: string;
  experience?: string;
  rating?: number;
  status: string; // PENDING_VERIFICATION, ACTIVE, SUSPENDED, REJECTED
  assignedDrivers?: any[];
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContractorService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  getContractors(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/contractors`);
  }

  getContractorById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/contractors/${id}`);
  }

  saveContractor(contractor: Contractor): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/contractors`, contractor);
  }

  approveContractor(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/contractors/${id}/approve`, {});
  }

  rejectContractor(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/contractors/${id}/reject`, {});
  }

  suspendContractor(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/contractors/${id}/suspend`, {});
  }

  unsuspendContractor(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/contractors/${id}/unsuspend`, {});
  }

  deleteContractor(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/api/v1/contractors/${id}`);
  }
}
