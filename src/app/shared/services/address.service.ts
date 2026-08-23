import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Address {
  id?: number;
  userId?: number;
  addressType?: string;
  label?: string;
  contactName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;
  isDefault?: boolean;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  getMyAddresses(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/addresses`);
  }

  getAddressById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/addresses/${id}`);
  }

  saveAddress(address: Address): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/addresses`, address);
  }

  deleteAddress(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/api/v1/addresses/${id}`);
  }
}
