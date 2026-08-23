import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolePermissionService, Permission, Menu } from '../../../shared/services/role-permission.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-role-permission-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-permission-setup.component.html',
  styleUrl: './role-permission-setup.component.scss'
})
export class RolePermissionSetupComponent implements OnInit {
  private rpService = inject(RolePermissionService);
  private toastService = inject(ToastService);

  roles: string[] = ['ADMIN', 'CONTRACTOR', 'DRIVER', 'CUSTOMER'];
  selectedRole = 'ADMIN';

  menus: Menu[] = [];
  permissions: Permission[] = [];
  
  assignedMenuIds: number[] = [];
  assignedPermissionIds: number[] = [];

  isLoading = true;
  isSaving = false;
  isActionLoading = false;

  // Modal form properties
  isModalOpen = false;
  modalTitle = 'Add Permission';
  editingPermission: Permission | null = null;
  permissionForm = {
    permissionName: '',
    permissionCode: ''
  };
  errorMessage = '';

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading = true;
    
    // Load active roles, menus list and all permissions
    this.rpService.getAllMenus().subscribe({
      next: (menuRes) => {
        if (menuRes.success && menuRes.data) {
          this.menus = menuRes.data;
        }
        
        this.rpService.getPermissions().subscribe({
          next: (permRes) => {
            if (permRes.success && permRes.data) {
              this.permissions = permRes.data;
            }
            
            // Load mappings for selected default role
            this.loadRoleAssignments(this.selectedRole);
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Error loading permissions:', err);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading menus:', err);
      }
    });
  }

  loadRoleAssignments(role: string): void {
    this.isLoading = true;
    this.selectedRole = role;
    
    this.rpService.getRoleAssignments(role).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.assignedMenuIds = res.data.assignedMenuIds;
          this.assignedPermissionIds = res.data.assignedPermissionIds;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading assignments:', err);
      }
    });
  }

  onRoleChange(role: string): void {
    this.loadRoleAssignments(role);
  }

  getRootMenus(): Menu[] {
    return this.menus.filter(m => !m.parentMenuId);
  }

  getSubMenus(parentMenuId: number): Menu[] {
    return this.menus.filter(m => m.parentMenuId === parentMenuId);
  }

  isMenuChecked(menuId: number): boolean {
    return this.assignedMenuIds.includes(menuId);
  }

  toggleMenu(menuId: number): void {
    const idx = this.assignedMenuIds.indexOf(menuId);
    if (idx > -1) {
      this.assignedMenuIds.splice(idx, 1);
    } else {
      this.assignedMenuIds.push(menuId);
    }
  }

  isPermissionChecked(permissionId: number): boolean {
    return this.assignedPermissionIds.includes(permissionId);
  }

  togglePermission(permissionId: number): void {
    const idx = this.assignedPermissionIds.indexOf(permissionId);
    if (idx > -1) {
      this.assignedPermissionIds.splice(idx, 1);
    } else {
      this.assignedPermissionIds.push(permissionId);
    }
  }

  saveAssignments(): void {
    this.isSaving = true;
    this.rpService.saveRoleAssignments(this.selectedRole, this.assignedMenuIds, this.assignedPermissionIds).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.toastService.showSuccess(`✓ Access assignments for ${this.selectedRole} saved successfully.`);
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error saving assignments:', err);
        this.toastService.showError('Failed to save assignments.');
      }
    });
  }

  // Permission definition management modal
  openAddModal(): void {
    this.modalTitle = 'Add New Permission';
    this.editingPermission = null;
    this.errorMessage = '';
    this.permissionForm = {
      permissionName: '',
      permissionCode: ''
    };
    this.isModalOpen = true;
  }

  openEditModal(permission: Permission): void {
    this.modalTitle = 'Edit Permission';
    this.editingPermission = permission;
    this.errorMessage = '';
    this.permissionForm = {
      permissionName: permission.permissionName,
      permissionCode: permission.permissionCode
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  savePermission(): void {
    if (!this.permissionForm.permissionName.trim() || !this.permissionForm.permissionCode.trim()) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    this.isActionLoading = true;
    const payload: Permission = {
      id: this.editingPermission ? this.editingPermission.id : undefined,
      permissionName: this.permissionForm.permissionName.trim(),
      permissionCode: this.permissionForm.permissionCode.trim()
    };

    this.rpService.savePermission(payload).subscribe({
      next: (res) => {
        this.isActionLoading = false;
        if (res.success) {
          this.toastService.showSuccess('✓ Permission saved successfully!');
          this.closeModal();
          this.loadInitialData(); // Refresh definitions & maps
        } else {
          this.errorMessage = res.message || 'Operation failed.';
          this.toastService.showError(this.errorMessage);
        }
      },
      error: (err) => {
        this.isActionLoading = false;
        this.errorMessage = err.error?.message || 'Server error occurred.';
        this.toastService.showError(this.errorMessage);
        console.error('Error saving permission:', err);
      }
    });
  }

  deletePermission(id: number): void {
    if (confirm('Are you sure you want to delete this permission? It will also clear any role mappings associated with it.')) {
      this.isActionLoading = true;
      this.rpService.deletePermission(id).subscribe({
        next: (res) => {
          this.isActionLoading = false;
          if (res.success) {
            this.toastService.showSuccess('✓ Permission deleted successfully.');
            this.loadInitialData();
          }
        },
        error: (err) => {
          this.isActionLoading = false;
          console.error('Error deleting permission:', err);
          this.toastService.showError('Failed to delete permission.');
        }
      });
    }
  }
}
