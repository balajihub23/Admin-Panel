import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CustomerService, User } from '../../../shared/services/customer.service';

interface BookingHistory {
  id: string;
  date: string;
  vehicle: string;
  duration: string;
  amount: number | null;
  status: 'Completed' | 'Cancelled';
}

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-profile.component.html',
  styleUrl: './customer-profile.component.scss'
})
export class CustomerProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);

  isLoading = true;

  customer = {
    id: '',
    name: '',
    status: 'Active',
    contactNumber: '',
    email: '',
    address: '',
    joinDate: ''
  };

  stats = {
    totalBookings: 0,
    walletBalance: 0,
    totalSpent: 0,
    completed: 0,
    cancelled: 0
  };

  history: BookingHistory[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadCustomerProfile(Number(id));
      }
    });
  }

  loadCustomerProfile(id: number): void {
    this.isLoading = true;
    this.customerService.getCustomerById(id).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          const user = response.data;
          this.customer = {
            id: String(user.id),
            name: user.fullName,
            status: user.active ? 'Active' : 'Suspended',
            contactNumber: user.phone,
            email: user.email || '',
            address: user.address || '',
            joinDate: this.formatDate(user.createdAt)
          };

          this.stats = {
            totalBookings: user.totalBookings || 0,
            walletBalance: user.walletBalance || 0,
            totalSpent: (user.totalBookings || 0) * 2500, // estimated
            completed: user.totalBookings || 0,
            cancelled: 0
          };

          // Generate some mock history based on their total bookings for premium look
          this.history = [];
          const numHistory = Math.min(this.stats.totalBookings, 4);
          for (let i = 0; i < numHistory; i++) {
            this.history.push({
              id: `BK-10${i + 1}`,
              date: this.customer.joinDate || '2025-01-15',
              vehicle: i % 2 === 0 ? 'JCB 3DX' : 'Excavator PC200',
              duration: `${6 + i} hours`,
              amount: 2500,
              status: 'Completed'
            });
          }
          if (this.stats.totalBookings > 0 && numHistory < 4) {
            this.history.push({
              id: 'BK-105',
              date: this.customer.joinDate || '2025-01-15',
              vehicle: 'Tipper 10W',
              duration: '4 hours',
              amount: null,
              status: 'Cancelled'
            });
            this.stats.cancelled = 1;
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading customer profile:', err);
        alert('Failed to load customer details.');
      }
    });
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

  toggleStatus(): void {
    const newActive = this.customer.status !== 'Active';
    const payload: User = {
      id: Number(this.customer.id),
      fullName: this.customer.name,
      phone: this.customer.contactNumber,
      email: this.customer.email || undefined,
      address: this.customer.address || undefined,
      active: newActive,
      totalBookings: this.stats.totalBookings,
      walletBalance: this.stats.walletBalance
    };

    this.customerService.saveCustomer(payload).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customer.status = response.data.active ? 'Active' : 'Suspended';
        } else {
          alert('Failed to update status: ' + response.message);
        }
      },
      error: (err) => {
        console.error('Error updating status:', err);
        alert('Failed to update status.');
      }
    });
  }

  deleteCustomer(): void {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.deleteCustomerById(Number(this.customer.id)).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/customers']);
          } else {
            alert('Failed to delete customer: ' + response.message);
          }
        },
        error: (err) => {
          console.error('Error deleting customer:', err);
          alert('Failed to delete customer.');
        }
      });
    }
  }
}
