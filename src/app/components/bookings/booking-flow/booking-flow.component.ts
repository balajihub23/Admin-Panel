import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, Product } from '../../../shared/services/product.service';
import { AddressService, Address } from '../../../shared/services/address.service';
import { PricingService } from '../../../shared/services/pricing.service';
import { BookingService, Booking } from '../../../shared/services/booking.service';

@Component({
  selector: 'app-booking-flow',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-flow.component.html',
  styleUrls: ['./booking-flow.component.scss']
})
export class BookingFlowComponent implements OnInit {
  private productService = inject(ProductService);
  private addressService = inject(AddressService);
  private pricingService = inject(PricingService);
  private bookingService = inject(BookingService);
  private router = inject(Router);

  products: Product[] = [];
  addresses: Address[] = [];

  selectedProduct: Product | null = null;
  selectedPickupAddressId: number | null = null;
  selectedDestinationAddressId: number | null = null;

  bookingDate: string = new Date().toISOString().split('T')[0];
  bookingTime: string = '09:00';
  durationHours: number = 4.0;
  distanceKm: number = 15.0;
  notes: string = '';

  calculatedPrice: any = null;
  loadingCalculation = false;
  submittingBooking = false;

  showAddressModal = false;
  newAddress: Address = {
    addressType: 'SITE_LOCATION',
    label: '',
    contactName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: ''
  };

  ngOnInit(): void {
    this.loadProducts();
    this.loadAddresses();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (res) => {
        if (res.success) {
          this.products = (res.data || []).filter((p: Product) => p.active);
          if (this.products.length > 0) {
            this.selectProduct(this.products[0]);
          }
        }
      }
    });
  }

  loadAddresses(): void {
    this.addressService.getMyAddresses().subscribe({
      next: (res) => {
        if (res.success) {
          this.addresses = res.data || [];
          const def = this.addresses.find(a => a.isDefault);
          if (def) {
            this.selectedPickupAddressId = def.id!;
          } else if (this.addresses.length > 0) {
            this.selectedPickupAddressId = this.addresses[0].id!;
          }
        }
      }
    });
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
    this.recalculatePrice();
  }

  recalculatePrice(): void {
    if (!this.selectedProduct || !this.selectedProduct.id) return;
    this.loadingCalculation = true;
    this.pricingService.calculatePrice(
      this.selectedProduct.id,
      this.distanceKm,
      this.durationHours,
      0.0
    ).subscribe({
      next: (res) => {
        this.loadingCalculation = false;
        if (res.success) {
          this.calculatedPrice = res.data;
        }
      },
      error: (err) => {
        this.loadingCalculation = false;
        console.error('Calculation failed', err);
      }
    });
  }

  openAddAddressModal(): void {
    this.newAddress = {
      addressType: 'SITE_LOCATION',
      label: '',
      contactName: '',
      phone: '',
      addressLine1: '',
      city: '',
      state: '',
      postalCode: ''
    };
    this.showAddressModal = true;
  }

  closeAddressModal(): void {
    this.showAddressModal = false;
  }

  saveAddress(): void {
    if (!this.newAddress.addressLine1 || !this.newAddress.city) {
      alert('Address line 1 and City are required');
      return;
    }
    this.addressService.saveAddress(this.newAddress).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeAddressModal();
          this.loadAddresses();
        }
      },
      error: (err) => alert('Failed to save address')
    });
  }

  addToCart(): void {
    if (!this.selectedProduct || !this.selectedProduct.id) return;
    const cartItem = {
      productId: this.selectedProduct.id,
      pickupAddressId: this.selectedPickupAddressId,
      destinationAddressId: this.selectedDestinationAddressId,
      bookingDate: this.bookingDate,
      bookingTime: this.bookingTime,
      durationHours: this.durationHours,
      distanceKm: this.distanceKm,
      notes: this.notes
    };
    this.bookingService.addToCart(cartItem).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Item added to booking cart!');
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to add to cart')
    });
  }

  confirmBookingNow(): void {
    if (!this.selectedProduct || !this.selectedProduct.id) {
      alert('Please select a product');
      return;
    }
    this.submittingBooking = true;
    const bookingPayload: Booking = {
      productId: this.selectedProduct.id,
      pickupAddressId: this.selectedPickupAddressId || undefined,
      destinationAddressId: this.selectedDestinationAddressId || undefined,
      bookingDate: this.bookingDate,
      bookingTime: this.bookingTime,
      durationHours: this.durationHours,
      distanceKm: this.distanceKm,
      notes: this.notes,
      status: 'CONFIRMED'
    };

    this.bookingService.confirmBooking(bookingPayload).subscribe({
      next: (res) => {
        this.submittingBooking = false;
        if (res.success) {
          alert(`Booking Confirmed! Number: ${res.data.bookingNumber}`);
          this.router.navigate(['/bookings']);
        }
      },
      error: (err) => {
        this.submittingBooking = false;
        alert(err.error?.message || 'Booking confirmation failed');
      }
    });
  }
}
