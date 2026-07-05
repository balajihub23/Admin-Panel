import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService, User } from '../../../shared/services/customer.service';

interface Customer {
  id: string;
  name: string;
  joinDate: string;
  contactNumber: string;
  email: string;
  totalBookings: number;
  walletBalance: number;
  status: 'Active' | 'Suspended';
  address?: string;
}

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);

  totalCustomers = 0;
  activeCustomers = 0;
  newThisMonth = 0;
  suspended = 0;

  customers: Customer[] = [];
  searchQuery = '';

  isSaving = false;
  isRefreshing = false;
  isLoading = true;
  selectedStatusFilter = 'All';
  selectedDateFilter = 'All';
  customFromDate = '';
  customToDate = '';
  appliedFromDate = '';
  appliedToDate = '';

  // Modal form properties
  isModalOpen = false;
  modalTitle = 'Add Customer';
  editingCustomer: Customer | null = null;

  customerName = '';
  customerPhone = '';
  customerEmail = '';
  customerAddress = '';
  customerPassword = '';
  customerStatus: 'Active' | 'Suspended' = 'Active';
  customerWalletBalance = 0;
  customerTotalBookings = 0;

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.customers = response.data.map(u => this.mapUserToCustomer(u));
          this.calculateStats();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading customers:', err);
      }
    });
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        this.isRefreshing = false;
        if (response.success && response.data) {
          this.customers = response.data.map(u => this.mapUserToCustomer(u));
          this.calculateStats();
        }
      },
      error: (err) => {
        this.isRefreshing = false;
        console.error('Error refreshing customers:', err);
      }
    });
  }

  onDateFilterChange(): void {
    if (this.selectedDateFilter !== 'Custom') {
      this.appliedFromDate = '';
      this.appliedToDate = '';
      this.customFromDate = '';
      this.customToDate = '';
    }
  }

  applyCustomDateFilter(): void {
    this.appliedFromDate = this.customFromDate;
    this.appliedToDate = this.customToDate;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatusFilter = 'All';
    this.selectedDateFilter = 'All';
    this.customFromDate = '';
    this.customToDate = '';
    this.appliedFromDate = '';
    this.appliedToDate = '';
  }

  exportToExcel(): void {
    if (this.filteredCustomers.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Customer ID',
      'Name',
      'Join Date',
      'Contact Number',
      'Email',
      'Total Bookings',
      'Wallet Balance',
      'Status',
      'Address'
    ];

    const rows = this.filteredCustomers.map(c => [
      `CUST-${c.id}`,
      c.name,
      c.joinDate,
      c.contactNumber,
      c.email,
      c.totalBookings,
      c.walletBalance,
      c.status,
      c.address
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const textVal = String(val === null || val === undefined ? '' : val);
        const escaped = textVal.replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') || escaped.includes('\r')) {
          return `"${escaped}"`;
        }
        return escaped;
      }).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const dateStr = now.toISOString().substring(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_export_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private mapUserToCustomer(user: User): Customer {
    return {
      id: String(user.id),
      name: user.fullName,
      joinDate: this.formatDate(user.createdAt),
      contactNumber: user.phone,
      email: user.email || '',
      totalBookings: user.totalBookings || 0,
      walletBalance: user.walletBalance || 0,
      status: user.active ? 'Active' : 'Suspended',
      address: user.address || ''
    };
  }

  private formatDate(dateVal: any): string {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
      return dateVal.substring(0, 10);
    }
    if (Array.isArray(dateVal)) {
      const y = dateVal[0];
      const m = String(dateVal[1]).padStart(2, '0');
      const d = String(dateVal[2]).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return '';
  }

  private calculateStats(): void {
    this.totalCustomers = this.customers.length;
    this.activeCustomers = this.customers.filter(c => c.status === 'Active').length;
    this.suspended = this.customers.filter(c => c.status === 'Suspended').length;

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.newThisMonth = this.customers.filter(c => c.joinDate.startsWith(currentYearMonth)).length;
  }

  get filteredCustomers(): Customer[] {
    let result = this.customers;

    // 1. Text Search Query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.contactNumber.includes(q) ||
        c.id.includes(q)
      );
    }

    // 2. Status Filter
    if (this.selectedStatusFilter !== 'All') {
      result = result.filter(c => c.status === this.selectedStatusFilter);
    }

    // 3. Date Joined Filter
    if (this.selectedDateFilter !== 'All') {
      const now = new Date();
      result = result.filter(c => {
        if (!c.joinDate) return false;
        const joinDate = new Date(c.joinDate);
        
        // Calculate difference in days
        const diffTime = Math.abs(now.getTime() - joinDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (this.selectedDateFilter === 'Today') {
          return joinDate.toDateString() === now.toDateString();
        } else if (this.selectedDateFilter === 'ThisWeek') {
          return diffDays <= 7;
        } else if (this.selectedDateFilter === 'ThisMonth') {
          return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
        } else if (this.selectedDateFilter === 'Custom') {
          if (!this.appliedFromDate && !this.appliedToDate) return true; // Show all if no custom range applied yet
          
          const joinTime = joinDate.getTime();
          
          if (this.appliedFromDate) {
            const fromDate = new Date(this.appliedFromDate);
            fromDate.setHours(0, 0, 0, 0);
            if (joinTime < fromDate.getTime()) return false;
          }
          
          if (this.appliedToDate) {
            const toDate = new Date(this.appliedToDate);
            toDate.setHours(23, 59, 59, 999);
            if (joinTime > toDate.getTime()) return false;
          }
          
          return true;
        }
        return true;
      });
    }

    return result;
  }

  openAddModal(): void {
    this.modalTitle = 'Add New Customer';
    this.editingCustomer = null;
    this.resetForm();
    this.isSaving = false;
    this.isModalOpen = true;
  }

  openEditModal(customer: Customer, event: Event): void {
    event.stopPropagation(); // Prevent navigating to profile page
    this.modalTitle = 'Edit Customer';
    this.editingCustomer = customer;
    this.customerName = customer.name;
    this.customerPhone = customer.contactNumber;
    this.customerEmail = customer.email;
    this.customerAddress = customer.address || '';
    this.customerStatus = customer.status;
    this.customerWalletBalance = customer.walletBalance;
    this.customerTotalBookings = customer.totalBookings;
    this.customerPassword = ''; // Keep password blank unless changing
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  resetForm(): void {
    this.customerName = '';
    this.customerPhone = '';
    this.customerEmail = '';
    this.customerAddress = '';
    this.customerPassword = '';
    this.customerStatus = 'Active';
    this.customerWalletBalance = 0;
    this.customerTotalBookings = 0;
  }

  onSubmit(): void {
    if (!this.customerName || !this.customerPhone) {
      alert('Name and Contact Number are required!');
      return;
    }

    this.isSaving = true;

    const payload: User = {
      id: this.editingCustomer ? Number(this.editingCustomer.id) : 0,
      fullName: this.customerName,
      phone: this.customerPhone,
      email: this.customerEmail || undefined,
      address: this.customerAddress || undefined,
      active: this.customerStatus === 'Active',
      walletBalance: this.customerWalletBalance,
      totalBookings: this.customerTotalBookings,
      passwordHash: this.customerPassword || undefined
    };

    this.customerService.saveCustomer(payload).subscribe({
      next: (response) => {
        this.isSaving = false;
        if (response.success) {
          this.loadCustomers();
          this.closeModal();
        } else {
          alert('Failed to save customer: ' + response.message);
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error saving customer:', err);
        alert(err.error?.message || 'Error occurred while saving customer');
      }
    });
  }

  deleteCustomer(id: string, event: Event): void {
    event.stopPropagation(); // Prevent navigating to profile page
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.deleteCustomerById(Number(id)).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadCustomers();
          } else {
            alert('Failed to delete customer: ' + response.message);
          }
        },
        error: (err) => {
          console.error('Error deleting customer:', err);
          alert(err.error?.message || 'Error occurred while deleting customer');
        }
      });
    }
  }
}
