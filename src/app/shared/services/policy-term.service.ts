import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PolicyTerm {
  id?: number;
  targetApp: string; // CUSTOMER, DRIVER, BOTH
  policyType: string; // TERMS, PRIVACY, REFUND, CANCELLATION, RENTAL_RULES, OUTSTATION_TERMS, etc.
  title: string;
  content: string;
  active?: boolean;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PolicyTermService {
  private adminApiUrl = `${environment.serverApi}/api/v1/admin/policies`;
  private publicApiUrl = `${environment.serverApi}/api/v1/policies`;

  constructor(private http: HttpClient) {}

  getAllPolicies(): Observable<{ success: boolean; data: PolicyTerm[] }> {
    return this.http.get<{ success: boolean; data: PolicyTerm[] }>(this.adminApiUrl);
  }

  getPublicPolicies(targetApp: string = 'CUSTOMER', policyType?: string): Observable<{ success: boolean; data: PolicyTerm | PolicyTerm[] }> {
    let url = `${this.publicApiUrl}?targetApp=${targetApp}`;
    if (policyType) url += `&policyType=${policyType}`;
    return this.http.get<{ success: boolean; data: PolicyTerm | PolicyTerm[] }>(url);
  }

  createPolicy(policy: PolicyTerm): Observable<{ success: boolean; data: PolicyTerm }> {
    return this.http.post<{ success: boolean; data: PolicyTerm }>(this.adminApiUrl, policy);
  }

  updatePolicy(id: number, policy: Partial<PolicyTerm>): Observable<{ success: boolean; data: PolicyTerm }> {
    return this.http.put<{ success: boolean; data: PolicyTerm }>(`${this.adminApiUrl}/${id}`, policy);
  }

  deletePolicy(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.adminApiUrl}/${id}`);
  }
}
