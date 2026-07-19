import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService, MenuAdminItem, MenuSaveRequest } from '../../../shared/services/menu.service';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-list.component.html',
  styleUrl: './menu-list.component.scss'
})
export class MenuListComponent implements OnInit {
  private menuService = inject(MenuService);

  menus: MenuAdminItem[] = [];
  isLoading = true;
  isRefreshing = false;
  isSaving = false;

  // Stats
  totalMenus = 0;
  rootMenus = 0;
  subMenus = 0;
  inactiveMenus = 0;

  // Filters
  searchQuery = '';

  // Modal
  isModalOpen = false;
  modalTitle = 'Add Menu';
  editingMenu: MenuAdminItem | null = null;

  // Form fields
  formMenuName = '';
  formMenuCode = '';
  formParentMenuId: number | null = null;
  formRoutePath = '';
  formIcon = '';
  formDisplayOrder = 0;
  formActive = true;
  formError = '';

  ngOnInit(): void {
    this.loadMenus();
  }

  loadMenus(): void {
    this.isLoading = true;
    this.menuService.getAllMenusAdmin().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.menus = res.data;
          this.calculateStats();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading menus:', err);
      }
    });
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.menuService.getAllMenusAdmin().subscribe({
      next: (res) => {
        this.isRefreshing = false;
        if (res.success && res.data) {
          this.menus = res.data;
          this.calculateStats();
        }
      },
      error: (err) => {
        this.isRefreshing = false;
        console.error('Error refreshing menus:', err);
      }
    });
  }

  private calculateStats(): void {
    this.totalMenus = this.menus.length;
    this.rootMenus = this.menus.filter(m => !m.parentMenuId).length;
    this.subMenus = this.menus.filter(m => !!m.parentMenuId).length;
    this.inactiveMenus = this.menus.filter(m => !m.active).length;
  }

  get filteredMenus(): MenuAdminItem[] {
    if (!this.searchQuery.trim()) return this.menus;
    const q = this.searchQuery.toLowerCase();
    return this.menus.filter(m =>
      m.menuName.toLowerCase().includes(q) ||
      m.menuCode.toLowerCase().includes(q) ||
      (m.routePath && m.routePath.toLowerCase().includes(q))
    );
  }

  getParentName(parentMenuId: number | null | undefined): string {
    if (!parentMenuId) return '—';
    const parent = this.menus.find(m => m.id === parentMenuId);
    return parent ? parent.menuName : '—';
  }

  // ── Modal ────────────────────────────────────────────────────────────────────
  openAddModal(): void {
    this.modalTitle = 'Add New Menu';
    this.editingMenu = null;
    this.resetForm();
    this.isModalOpen = true;
  }

  openEditModal(menu: MenuAdminItem): void {
    this.modalTitle = 'Edit Menu';
    this.editingMenu = menu;
    this.formMenuName = menu.menuName;
    this.formMenuCode = menu.menuCode;
    this.formParentMenuId = menu.parentMenuId ?? null;
    this.formRoutePath = menu.routePath ?? '';
    this.formIcon = menu.icon ?? '';
    this.formDisplayOrder = menu.displayOrder;
    this.formActive = menu.active;
    this.formError = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  resetForm(): void {
    this.formMenuName = '';
    this.formMenuCode = '';
    this.formParentMenuId = null;
    this.formRoutePath = '';
    this.formIcon = '';
    this.formDisplayOrder = 0;
    this.formActive = true;
    this.formError = '';
  }

  onSubmit(): void {
    if (!this.formMenuName.trim() || !this.formMenuCode.trim()) {
      this.formError = 'Menu Name and Menu Code are required.';
      return;
    }

    this.isSaving = true;
    this.formError = '';

    const payload: MenuSaveRequest = {
      id: this.editingMenu ? this.editingMenu.id : undefined,
      menuName: this.formMenuName.trim(),
      menuCode: this.formMenuCode.trim(),
      parentMenuId: this.formParentMenuId || null,
      routePath: this.formRoutePath.trim() || undefined,
      icon: this.formIcon.trim() || undefined,
      displayOrder: this.formDisplayOrder,
      active: this.formActive
    };

    this.menuService.saveMenu(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.loadMenus();
          this.closeModal();
        } else {
          this.formError = res.message || 'Failed to save menu.';
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.formError = err.error?.message || 'An error occurred while saving.';
        console.error('Error saving menu:', err);
      }
    });
  }

  deleteMenu(id: number): void {
    if (confirm('Are you sure you want to delete this menu? This may affect sidebar navigation for mapped roles.')) {
      this.menuService.deleteMenu(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadMenus();
          } else {
            alert('Failed to delete menu: ' + res.message);
          }
        },
        error: (err) => {
          console.error('Error deleting menu:', err);
          alert(err.error?.message || 'Error occurred while deleting menu');
        }
      });
    }
  }
}
