import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Booking {
  id?: number;
  bookingNumber?: string;
  customerId?: number;
  productId: number;
  contractorId?: number;
  driverId?: number;
  pickupAddressId?: number;
  destinationAddressId?: number;
  bookingDate?: string;
  bookingTime?: string;
  distanceKm?: number;
  durationHours?: number;
  baseAmount?: number;
  distanceAmount?: number;
  timeAmount?: number;
  waitingAmount?: number;
  driverAmount?: number;
  operatorAmount?: number;
  bookingFee?: number;
  taxAmount?: number;
  totalAmount?: number;
  status?: string;
  paymentStatus?: string;
  notes?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  // Cart operations
  getCart(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/cart`);
  }

  addToCart(cartItem: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/cart`, cartItem);
  }

  removeFromCart(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/api/v1/cart/${id}`);
  }

  clearCart(): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/api/v1/cart`);
  }

  // Booking operations
  getBookings(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/bookings`);
  }

  getBookingsByContractorId(contractorId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/bookings/contractor/${contractorId}`);
  }

  getBookingsByDriverId(driverId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/bookings/driver/${driverId}`);
  }

  getBookingById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/bookings/${id}`);
  }

  confirmBooking(booking: Booking): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/bookings/confirm`, booking);
  }

  assignDriverToBooking(bookingId: number, contractorId?: number | null, driverId?: number | null): Observable<any> {
    let params = '';
    if (contractorId && driverId) {
      params = `?contractorId=${contractorId}&driverId=${driverId}`;
    } else if (contractorId) {
      params = `?contractorId=${contractorId}`;
    } else if (driverId) {
      params = `?driverId=${driverId}`;
    }
    return this.http.post<any>(`${this.baseUrl}/api/v1/bookings/${bookingId}/assign-driver${params}`, {});
  }

  updateBookingStatus(bookingId: number, newStatus: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/bookings/${bookingId}/status?newStatus=${newStatus}`, {});
  }
}
