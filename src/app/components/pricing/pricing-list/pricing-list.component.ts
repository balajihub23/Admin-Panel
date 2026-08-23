import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PricingService, Pricing } from '../../../shared/services/pricing.service';
import { ProductService, Product } from '../../../shared/services/product.service';

@Component({
  selector: 'app-pricing-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pricing-list.component.html',
  styleUrls: ['./pricing-list.component.scss']
})
export class PricingListComponent implements OnInit {
  private pricingService = inject(PricingService);
  private productService = inject(ProductService);

  pricings: Pricing[] = [];
  products: Product[] = [];

  showModal = false;
  editingPricing: Pricing = this.initPricing();
  selectedProduct: Product | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.productService.getProducts().subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data || [];
        }
      }
    });

    this.pricingService.getPricings().subscribe({
      next: (res) => {
        if (res.success) {
          this.pricings = res.data || [];
        }
      }
    });
  }

  initPricing(): Pricing {
    return {
      productId: 0,
      basePrice: 0,
      perKmPrice: 0,
      perMinutePrice: 0,
      perHourPrice: 0,
      minimumFare: 0,
      minimumHours: 0,
      waitingCharge: 0,
      driverCharge: 0,
      operatorCharge: 0,
      bookingFee: 0,
      cancellationFee: 0,
      surgeMultiplier: 1.0,
      taxPercentage: 5.0,
      active: true
    };
  }

  getProductName(productId: number): string {
    const p = this.products.find(prod => prod.id === productId);
    return p ? p.name : `Product #${productId}`;
  }

  getProductType(productId: number): string {
    const p = this.products.find(prod => prod.id === productId);
    return p ? (p.productType || 'JCB') : 'JCB';
  }

  isJcbType(): boolean {
    if (!this.selectedProduct) return true;
    const type = (this.selectedProduct.productType || '').toUpperCase();
    return type === 'JCB' || type === 'HEAVY_EQUIPMENT' || type === 'EXCAVATOR' || type === 'CRANE';
  }

  onProductChange(): void {
    const p = this.products.find(prod => prod.id === Number(this.editingPricing.productId));
    this.selectedProduct = p || null;
  }

  openCreateModal(): void {
    this.editingPricing = this.initPricing();
    if (this.products.length > 0) {
      this.editingPricing.productId = this.products[0].id!;
      this.onProductChange();
    }
    this.showModal = true;
  }

  openEditModal(pricing: Pricing): void {
    this.editingPricing = { ...pricing };
    this.onProductChange();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  savePricing(): void {
    if (!this.editingPricing.productId) {
      alert('Please select a product');
      return;
    }
    this.pricingService.savePricing(this.editingPricing).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Pricing configuration saved successfully');
          this.closeModal();
          this.loadData();
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to save pricing')
    });
  }
}
