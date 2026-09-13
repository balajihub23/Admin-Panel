import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SupportTicket {
  id: number;
  ticketNumber: string;
  userId: number;
  userName?: string;
  userPhone?: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  attachmentUrl?: string;
  attachmentName?: string;
  status: string;
  assignedAdminId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportMessage {
  id: number;
  ticketId: number;
  senderUserId: number;
  senderRole: string;
  message: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  getTickets(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/support/tickets`);
  }

  getTicketDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/support/tickets/${id}`);
  }

  sendMessage(ticketId: number, message: string, attachmentUrl?: string, attachmentName?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/support/tickets/${ticketId}/messages`, {
      message,
      attachmentUrl,
      attachmentName
    });
  }

  updateTicketStatus(ticketId: number, status: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/support/tickets/${ticketId}/status?newStatus=${status}`, {});
  }

  reopenTicket(ticketId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/support/tickets/${ticketId}/reopen`, {});
  }
}
