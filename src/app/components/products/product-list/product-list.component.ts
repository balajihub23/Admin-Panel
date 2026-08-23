import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../../shared/services/product.service';
import { PricingService, Pricing } from '../../../shared/services/pricing.service';
import { environment } from '../../../../environments/environment';

import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private pricingService = inject(PricingService);
  private toastService = inject(ToastService);

  products: Product[] = [];
  showModal = false;
  editingProduct: Product = this.initProduct();
  productImages: string[] = [];

  // Inline Pricing Configuration Popup Modal
  showPricingModal = false;
  selectedProductForPricing: Product | null = null;
  editingPricing: Pricing = this.initPricing();

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data || [];
        }
      },
      error: (err) => console.error('Error loading products', err)
    });
  }

  initProduct(): Product {
    return {
      name: '',
      code: '',
      productType: 'HEAVY_EQUIPMENT',
      category: 'HEAVY_EQUIPMENT',
      description: '',
      imageUrl: '',
      active: true
    };
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

  selectedRawFiles: File[] = [];

  // --- Image Upload Handlers ---
  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${environment.serverApi}${url}`;
  }

  getProductImageList(imageUrlStr?: string): string[] {
    if (!imageUrlStr) return [];
    try {
      const trimmed = imageUrlStr.trim();
      let list: string[] = [];
      if (trimmed.startsWith('[')) {
        list = JSON.parse(trimmed);
      } else if (trimmed.includes(',') && !trimmed.startsWith('data:')) {
        list = trimmed.split(',').map(s => s.trim()).filter(s => s.length > 0);
      } else {
        list = [trimmed];
      }
      return list.map(img => this.getImageUrl(img));
    } catch {
      return [this.getImageUrl(imageUrlStr)];
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    this.selectedRawFiles.push(...files);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.productImages.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.productImages.splice(index, 1);
    if (index < this.selectedRawFiles.length) {
      this.selectedRawFiles.splice(index, 1);
    }
    this.editingProduct.imageUrl = JSON.stringify(this.productImages);
  }

  // --- Product Modal Controls ---
  openCreateModal(): void {
    this.editingProduct = this.initProduct();
    this.productImages = [];
    this.selectedRawFiles = [];
    this.showModal = true;
  }

  openEditModal(product: Product): void {
    this.editingProduct = { ...product };
    this.productImages = this.getProductImageList(product.imageUrl);
    this.selectedRawFiles = [];
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  isSaving = false;
  isSavingPricing = false;

  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';
  private toastTimeout: any;

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastService.show(message, type);
  }

  saveProduct(): void {
    if (!this.editingProduct.name || !this.editingProduct.code) {
      this.showToast('Product name and code are required.', 'error');
      return;
    }

    this.isSaving = true;

    this.productService.saveProduct(this.editingProduct).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const savedProduct = res.data;
          if (this.selectedRawFiles.length > 0) {
            this.productService.uploadProductImages(savedProduct.id, this.selectedRawFiles).subscribe({
              next: () => {
                this.isSaving = false;
                this.showToast('✓ Product and images saved successfully!', 'success');
                this.closeModal();
                this.loadProducts();
              },
              error: (err) => {
                this.isSaving = false;
                this.showToast('Product saved, but image upload failed: ' + (err.error?.message || err.message), 'error');
                this.closeModal();
                this.loadProducts();
              }
            });
          } else {
            this.isSaving = false;
            this.showToast('✓ Product saved successfully!', 'success');
            this.closeModal();
            this.loadProducts();
          }
        } else {
          this.isSaving = false;
          this.showToast(res.message || 'Failed to save product.', 'error');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.showToast(err.error?.message || 'Failed to save product.', 'error');
      }
    });
  }

  deleteProduct(id: number): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.showToast('✓ Product deleted successfully.', 'success');
          this.loadProducts();
        },
        error: (err) => this.showToast('Delete failed: ' + err.message, 'error')
      });
    }
  }

  // --- Inline Pricing Popup Controls ---
  openConfigurePricingModal(product: Product): void {
    this.selectedProductForPricing = product;
    this.editingPricing = this.initPricing();
    this.editingPricing.productId = product.id!;
    this.editingPricing.pricingModel = (product.productType === 'HEAVY_EQUIPMENT' || product.productType === 'JCB') ? 'HEAVY_EQUIPMENT' : 'RIDE';

    this.pricingService.getPricingByProductId(product.id!).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.editingPricing = { ...res.data };
        }
        this.showPricingModal = true;
      },
      error: () => {
        this.showPricingModal = true;
      }
    });
  }

  closePricingModal(): void {
    this.showPricingModal = false;
    this.selectedProductForPricing = null;
  }

  isJcbTypePricing(): boolean {
    if (!this.selectedProductForPricing) return true;
    const type = (this.selectedProductForPricing.productType || '').toUpperCase();
    return type === 'JCB' || type === 'HEAVY_EQUIPMENT' || type === 'EXCAVATOR' || type === 'CRANE';
  }

  savePricingRule(): void {
    if (!this.editingPricing.productId) return;
    this.isSavingPricing = true;
    this.pricingService.savePricing(this.editingPricing).subscribe({
      next: (res) => {
        this.isSavingPricing = false;
        if (res.success) {
          this.showToast('✓ Pricing configuration saved successfully!', 'success');
          this.closePricingModal();
          this.loadProducts();
        } else {
          this.showToast(res.message || 'Failed to save pricing configuration', 'error');
        }
      },
      error: (err) => {
        this.isSavingPricing = false;
        this.showToast(err.error?.message || 'Failed to save pricing configuration', 'error');
      }
    });
  }
}
