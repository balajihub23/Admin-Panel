import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Pricing {
  id?: number;
  productId: number;
  pricingModel?: string; // RIDE or HEAVY_EQUIPMENT
  chargingMethod?: string; // HOURLY, DAILY, HOURLY_DAILY
  basePrice: number;
  perKmPrice: number;
  perMinutePrice: number;
  perHourPrice: number;
  dailyRate?: number;
  extraHourRate?: number;
  discount?: number;
  minimumFare: number;
  minimumHours: number;
  waitingCharge: number;
  driverCharge: number;
  operatorCharge: number;
  bookingFee: number;
  cancellationFee: number;
  surgeMultiplier: number;
  taxPercentage: number;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  getPricings(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/pricings`);
  }

  getPricingByProductId(productId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/pricings/product/${productId}`);
  }

  savePricing(pricing: Pricing): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/pricings`, pricing);
  }

  calculatePrice(productId: number, distanceKm: number = 0, durationHours: number = 0, waitingMinutes: number = 0): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/pricings/calculate?productId=${productId}&distanceKm=${distanceKm}&durationHours=${durationHours}&waitingMinutes=${waitingMinutes}`);
  }
}
