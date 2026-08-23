import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PricingService, Pricing } from '../../../shared/services/pricing.service';
import { ProductService, Product } from '../../../shared/services/product.service';

import { ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';

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
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  pricings: Pricing[] = [];
  displayedPricings: Pricing[] = [];
  products: Product[] = [];
  filterProductId: number | null = null;

  showModal = false;
  isSaving = false;
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
          this.checkQueryParams();
        }
      }
    });

    this.pricingService.getPricings().subscribe({
      next: (res) => {
        if (res.success) {
          this.pricings = res.data || [];
          this.applyFilter();
        }
      }
    });
  }

  applyFilter(): void {
    if (this.filterProductId) {
      this.displayedPricings = this.pricings.filter(pr => pr.productId === this.filterProductId);
    } else {
      this.displayedPricings = [...this.pricings];
    }
  }

  checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      const pid = params['productId'];
      if (pid) {
        this.filterProductId = Number(pid);
        this.applyFilter();
      } else {
        this.filterProductId = null;
        this.applyFilter();
      }
    });
  }

  initPricing(): Pricing {
    return {
      productId: 0,
      pricingModel: 'HEAVY_EQUIPMENT',
      chargingMethod: 'HOURLY_DAILY',
      basePrice: 0,
      perKmPrice: 0,
      perMinutePrice: 0,
      perHourPrice: 0,
      dailyRate: 0,
      extraHourRate: 0,
      discount: 0,
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
    const pType = (p?.productType || '').toUpperCase();
    if (pType === 'HEAVY_EQUIPMENT' || pType === 'JCB' || pType === 'EXCAVATOR' || pType === 'CRANE') return 'Heavy Equipment';
    return 'Ride';
  }

  isJcbType(): boolean {
    if (!this.selectedProduct) return true;
    const type = (this.selectedProduct.productType || '').toUpperCase();
    return type === 'JCB' || type === 'HEAVY_EQUIPMENT' || type === 'EXCAVATOR' || type === 'CRANE';
  }

  onProductChange(): void {
    const p = this.products.find(prod => prod.id === Number(this.editingPricing.productId));
    this.selectedProduct = p || null;
    if (this.selectedProduct) {
      this.editingPricing.pricingModel = this.isJcbType() ? 'HEAVY_EQUIPMENT' : 'RIDE';
    }
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
      this.toastService.showError('Please select a product.');
      return;
    }
    this.isSaving = true;
    this.pricingService.savePricing(this.editingPricing).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.toastService.showSuccess('✓ Pricing configuration saved successfully!');
          this.closeModal();
          this.loadData();
        } else {
          this.toastService.showError(res.message || 'Failed to save pricing configuration');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.toastService.showError(err.error?.message || 'Failed to save pricing configuration');
      }
    });
  }
}
