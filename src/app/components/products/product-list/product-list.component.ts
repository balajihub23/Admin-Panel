import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../../shared/services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);

  products: Product[] = [];
  showModal = false;
  editingProduct: Product = this.initProduct();

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
      productType: 'JCB',
      category: 'HEAVY_EQUIPMENT',
      description: '',
      active: true
    };
  }

  openCreateModal(): void {
    this.editingProduct = this.initProduct();
    this.showModal = true;
  }

  openEditModal(product: Product): void {
    this.editingProduct = { ...product };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveProduct(): void {
    if (!this.editingProduct.name || !this.editingProduct.code) {
      alert('Product name and code are required');
      return;
    }
    this.productService.saveProduct(this.editingProduct).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Product saved successfully');
          this.closeModal();
          this.loadProducts();
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to save product')
    });
  }

  deleteProduct(id: number): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => this.loadProducts(),
        error: (err) => alert('Delete failed: ' + err.message)
      });
    }
  }
}
