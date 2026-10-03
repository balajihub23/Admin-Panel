import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VehicleType {
  id?: number;
  name: string;
  code: string;
  description?: string;
  iconUrl?: string;
  displayOrder?: number;
  active?: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  models?: VehicleModel[];
}

export interface VehicleModel {
  id?: number;
  vehicleTypeId: number;
  vehicleTypeName?: string;
  name: string;
  code?: string;
  description?: string;
  iconUrl?: string;
  displayOrder?: number;
  active?: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  subModels?: VehicleSubModel[];
}

export interface VehicleSubModel {
  id?: number;
  vehicleModelId: number;
  vehicleModelName?: string;
  vehicleTypeId?: number;
  vehicleTypeName?: string;
  name: string;
  code?: string;
  description?: string;
  manufacturer?: string;
  machineClass?: string;
  horsePower?: string;
  capacity?: string;
  fuelType?: string;
  iconUrl?: string;
  displayOrder?: number;
  active?: boolean;
  createdBy?: number;
  updatedBy?: number;
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
export class VehicleMasterService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.serverApi}/api/v1/admin/vehicle-masters`;

  // --- Vehicle Types ---
  getVehicleTypes(active?: boolean): Observable<ApiResponse<VehicleType[]>> {
    const params: any = {};
    if (active !== undefined) params.active = active;
    return this.http.get<ApiResponse<VehicleType[]>>(`${this.baseUrl}/types`, { params });
  }

  getVehicleTypeById(id: number): Observable<ApiResponse<VehicleType>> {
    return this.http.get<ApiResponse<VehicleType>>(`${this.baseUrl}/types/${id}`);
  }

  createVehicleType(type: VehicleType): Observable<ApiResponse<VehicleType>> {
    return this.http.post<ApiResponse<VehicleType>>(`${this.baseUrl}/types`, type);
  }

  updateVehicleType(id: number, type: VehicleType): Observable<ApiResponse<VehicleType>> {
    return this.http.put<ApiResponse<VehicleType>>(`${this.baseUrl}/types/${id}`, type);
  }

  changeVehicleTypeStatus(id: number, active: boolean): Observable<ApiResponse<VehicleType>> {
    return this.http.patch<ApiResponse<VehicleType>>(`${this.baseUrl}/types/${id}/status`, { active });
  }

  deleteVehicleType(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/types/${id}`);
  }

  // --- Vehicle Models ---
  getModels(active?: boolean): Observable<ApiResponse<VehicleModel[]>> {
    const params: any = {};
    if (active !== undefined) params.active = active;
    return this.http.get<ApiResponse<VehicleModel[]>>(`${this.baseUrl}/models`, { params });
  }

  getModelsByType(typeId: number, active?: boolean): Observable<ApiResponse<VehicleModel[]>> {
    const params: any = {};
    if (active !== undefined) params.active = active;
    return this.http.get<ApiResponse<VehicleModel[]>>(`${this.baseUrl}/types/${typeId}/models`, { params });
  }

  getModelById(id: number): Observable<ApiResponse<VehicleModel>> {
    return this.http.get<ApiResponse<VehicleModel>>(`${this.baseUrl}/models/${id}`);
  }

  createModel(model: VehicleModel): Observable<ApiResponse<VehicleModel>> {
    return this.http.post<ApiResponse<VehicleModel>>(`${this.baseUrl}/models`, model);
  }

  updateModel(id: number, model: VehicleModel): Observable<ApiResponse<VehicleModel>> {
    return this.http.put<ApiResponse<VehicleModel>>(`${this.baseUrl}/models/${id}`, model);
  }

  changeModelStatus(id: number, active: boolean): Observable<ApiResponse<VehicleModel>> {
    return this.http.patch<ApiResponse<VehicleModel>>(`${this.baseUrl}/models/${id}/status`, { active });
  }

  deleteModel(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/models/${id}`);
  }

  // --- Vehicle Sub Models ---
  getSubModels(active?: boolean): Observable<ApiResponse<VehicleSubModel[]>> {
    const params: any = {};
    if (active !== undefined) params.active = active;
    return this.http.get<ApiResponse<VehicleSubModel[]>>(`${this.baseUrl}/sub-models`, { params });
  }

  getSubModelsByModel(modelId: number, active?: boolean): Observable<ApiResponse<VehicleSubModel[]>> {
    const params: any = {};
    if (active !== undefined) params.active = active;
    return this.http.get<ApiResponse<VehicleSubModel[]>>(`${this.baseUrl}/models/${modelId}/sub-models`, { params });
  }

  getSubModelById(id: number): Observable<ApiResponse<VehicleSubModel>> {
    return this.http.get<ApiResponse<VehicleSubModel>>(`${this.baseUrl}/sub-models/${id}`);
  }

  createSubModel(subModel: VehicleSubModel): Observable<ApiResponse<VehicleSubModel>> {
    return this.http.post<ApiResponse<VehicleSubModel>>(`${this.baseUrl}/sub-models`, subModel);
  }

  updateSubModel(id: number, subModel: VehicleSubModel): Observable<ApiResponse<VehicleSubModel>> {
    return this.http.put<ApiResponse<VehicleSubModel>>(`${this.baseUrl}/sub-models/${id}`, subModel);
  }

  changeSubModelStatus(id: number, active: boolean): Observable<ApiResponse<VehicleSubModel>> {
    return this.http.patch<ApiResponse<VehicleSubModel>>(`${this.baseUrl}/sub-models/${id}/status`, { active });
  }

  deleteSubModel(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/sub-models/${id}`);
  }
}
