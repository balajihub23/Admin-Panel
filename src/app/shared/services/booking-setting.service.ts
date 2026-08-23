import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BookingSetting {
  id?: number;
  settingKey?: string;
  gateway?: string;
  paymentEnabled?: boolean;
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
  currency?: string;
  environment?: string;
  assignmentType?: string;
  initialRadiusKm?: number;
  radiusIncrementKm?: number;
  maxRadiusKm?: number;
  assignmentTimeoutSeconds?: number;
  maxLocationAgeSeconds?: number;
  notifyAdminWhenUnassigned?: boolean;
}

export interface BookingAssignment {
  id: number;
  bookingId: number;
  layerIndex: number;
  radiusKm: number;
  candidateType: string;
  candidateId: number;
  candidateUserId: number;
  distanceKm: number;
  status: string;
  offeredAt: string;
  respondedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingSettingService {
  private apiUrl = `${environment.serverApi}/api/v1/settings/booking`;

  constructor(private http: HttpClient) {}

  getSettings(): Observable<{ success: boolean; data: BookingSetting }> {
    return this.http.get<{ success: boolean; data: BookingSetting }>(this.apiUrl);
  }

  updateSettings(settings: BookingSetting): Observable<{ success: boolean; data: BookingSetting }> {
    return this.http.post<{ success: boolean; data: BookingSetting }>(this.apiUrl, settings);
  }

  getAssignmentAuditHistory(bookingId: number): Observable<{ success: boolean; data: BookingAssignment[] }> {
    return this.http.get<{ success: boolean; data: BookingAssignment[] }>(`${this.apiUrl}/assignments/${bookingId}`);
  }
}
