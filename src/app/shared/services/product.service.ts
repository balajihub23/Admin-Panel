import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Product {
  id?: number;
  name: string;
  code: string;
  productType: string; // HEAVY_EQUIPMENT or RIDE
  category?: string;
  description?: string;
  imageUrl?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  getProducts(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/products`);
  }

  getProductById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/products/${id}`);
  }

  saveProduct(product: Product): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/products`, product);
  }

  uploadProductImages(productId: number, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post<any>(`${this.baseUrl}/api/v1/products/${productId}/upload-images`, formData);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/api/v1/products/${id}`);
  }
}
