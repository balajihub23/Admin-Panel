import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id?: number;
  fullName: string;
  phone: string;
  email?: string;
  passwordHash?: string;
  role?: 'ADMIN' | 'CUSTOMER' | 'CONTRACTOR' | 'DRIVER';
  verified?: boolean;
  active?: boolean;
  totalBookings?: number;
  walletBalance?: number;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  getCustomers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/api/v1/customers`);
  }

  getCustomerById(id: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/api/v1/customers/${id}`);
  }

  saveCustomer(customer: User): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/api/v1/customers`, customer);
  }

  deleteCustomerById(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/api/v1/customers/${id}`);
  }

  deleteCustomer(customer: User): Observable<ApiResponse<void>> {
    // Angular HttpClient delete with body requires passing options with body parameter
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/api/v1/customers`, { body: customer });
  }
}
