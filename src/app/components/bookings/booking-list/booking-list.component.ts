import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingService, Booking } from '../../../shared/services/booking.service';
import { ProductService, Product } from '../../../shared/services/product.service';
import { PartnerService } from '../../../shared/services/partner.service';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.scss']
})
export class BookingListComponent implements OnInit {
  private bookingService = inject(BookingService);
  private productService = inject(ProductService);
  private partnerService = inject(PartnerService);
  private router = inject(Router);

  bookings: Booking[] = [];
  products: Product[] = [];
  contractors: any[] = [];
  drivers: any[] = [];

  statusFilter: string = 'ALL';
  selectedBooking: Booking | null = null;
  showDetailModal = false;

  showAssignModal = false;
  assignContractorId: number | null = null;
  assignDriverId: number | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.bookingService.getBookings().subscribe({
      next: (res) => {
        if (res.success) {
          this.bookings = res.data || [];
        }
      },
      error: (err) => console.error('Error loading bookings', err)
    });

    this.productService.getProducts().subscribe({
      next: (res) => { if (res.success) this.products = res.data || []; }
    });

    this.partnerService.getPartners('ALL').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.contractors = res.data.contractors || [];
          this.drivers = res.data.drivers || [];
        }
      }
    });
  }

  getProductName(productId: number): string {
    const p = this.products.find(prod => prod.id === productId);
    return p ? p.name : `Product #${productId}`;
  }

  filteredBookings(): Booking[] {
    if (this.statusFilter === 'ALL') return this.bookings;
    return this.bookings.filter(b => b.status === this.statusFilter);
  }

  createNewBooking(): void {
    this.router.navigate(['/bookings/new']);
  }

  viewDetails(booking: Booking): void {
    this.selectedBooking = booking;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedBooking = null;
  }

  openAssignModal(booking: Booking): void {
    this.selectedBooking = booking;
    this.assignContractorId = booking.contractorId || null;
    this.assignDriverId = booking.driverId || null;
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.assignContractorId = null;
    this.assignDriverId = null;
  }

  saveAssignment(): void {
    if (!this.selectedBooking || !this.selectedBooking.id) return;
    this.bookingService.assignDriverToBooking(
      this.selectedBooking.id,
      this.assignContractorId,
      this.assignDriverId
    ).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Assignment updated successfully');
          this.closeAssignModal();
          this.loadData();
        }
      },
      error: (err) => alert(err.error?.message || 'Assignment failed')
    });
  }

  updateStatus(booking: Booking, newStatus: string): void {
    if (!booking.id) return;
    this.bookingService.updateBookingStatus(booking.id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          alert(`Status updated to ${newStatus}`);
          this.loadData();
        }
      },
      error: (err) => alert(err.error?.message || 'Status transition invalid')
    });
  }
}
