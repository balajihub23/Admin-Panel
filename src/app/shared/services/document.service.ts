import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DocumentInfo {
  id: number;
  entityType: string;
  entityId: number;
  documentType: string;
  fileName: string;
  fileType: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  uploadDocument(file: File, entityType: string, entityId: number, documentType: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId.toString());
    formData.append('documentType', documentType);

    return this.http.post<any>(`${this.baseUrl}/api/v1/documents/upload`, formData);
  }

  getDocumentsForEntity(entityType: string, entityId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/documents/entity/${entityType}/${entityId}`);
  }

  downloadDocumentUrl(id: number): string {
    return `${this.baseUrl}/api/v1/documents/download/${id}`;
  }

  deleteDocument(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/api/v1/documents/${id}`);
  }

  associateDocuments(documentIds: number[], entityType: string, entityId: number): Observable<any> {
    // Build query string with repeated documentIds params for Spring List<Long> binding
    const params = new URLSearchParams();
    documentIds.forEach(id => params.append('documentIds', id.toString()));
    params.append('entityType', entityType);
    params.append('entityId', entityId.toString());
    return this.http.post<any>(`${this.baseUrl}/api/v1/documents/associate?${params.toString()}`, null);
  }
}
