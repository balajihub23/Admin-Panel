import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Driver {
  id?: number;
  userId?: number;
  contractorId?: number;
  fullName: string;
  phone: string;
  email?: string;
  licenseNumber?: string;
  aadhaarNumber?: string;
  experience?: string;
  rating?: number;
  totalJobs?: number;
  totalEarnings?: number;
  status: string; // PENDING_VERIFICATION, ACTIVE, OFFLINE, BUSY, SUSPENDED, REJECTED
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  getDrivers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/drivers`);
  }

  getDriverById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/drivers/${id}`);
  }

  saveDriver(driver: Driver): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/drivers`, driver);
  }

  approveDriver(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/drivers/${id}/approve`, {});
  }

  rejectDriver(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/drivers/${id}/reject`, {});
  }

  suspendDriver(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/drivers/${id}/suspend`, {});
  }

  unsuspendDriver(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/drivers/${id}/unsuspend`, {});
  }

  deleteDriver(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/api/v1/drivers/${id}`);
  }
}
