import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Permission {
  id?: number;
  permissionName: string;
  permissionCode: string;
  createdAt?: string;
}

export interface Menu {
  id: number;
  menuName: string;
  menuCode: string;
  parentMenuId?: number;
  routePath?: string;
  icon?: string;
  displayOrder: number;
  active: boolean;
}

export interface RoleAccessAssignmentResponse {
  assignedMenuIds: number[];
  assignedPermissionIds: number[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class RolePermissionService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.serverApi;

  // 1. Permission CRUD
  getPermissions(): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(`${this.baseUrl}/api/v1/permissions`);
  }

  savePermission(permission: Permission): Observable<ApiResponse<Permission>> {
    return this.http.post<ApiResponse<Permission>>(`${this.baseUrl}/api/v1/permissions`, permission);
  }

  deletePermission(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/api/v1/permissions/${id}`);
  }

  // 2. Role Access Config
  getRoles(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/api/v1/role-access/roles`);
  }

  getAllMenus(): Observable<ApiResponse<Menu[]>> {
    return this.http.get<ApiResponse<Menu[]>>(`${this.baseUrl}/api/v1/role-access/menus`);
  }

  getRoleAssignments(role: string): Observable<ApiResponse<RoleAccessAssignmentResponse>> {
    return this.http.get<ApiResponse<RoleAccessAssignmentResponse>>(`${this.baseUrl}/api/v1/role-access/assignments/${role}`);
  }

  saveRoleAssignments(role: string, menuIds: number[], permissionIds: number[]): Observable<ApiResponse<void>> {
    const payload = { menuIds, permissionIds };
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/api/v1/role-access/assignments/${role}`, payload);
  }
}
