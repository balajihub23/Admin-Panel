import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VehicleService, AdminVehicle } from '../../../shared/services/vehicle.service';
import { ToastService } from '../../../shared/services/toast.service';
import { DocumentService } from '../../../shared/services/document.service';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.scss']
})
export class VehicleListComponent implements OnInit {
  private vehicleService = inject(VehicleService);
  private toastService = inject(ToastService);
  private documentService = inject(DocumentService);
  private router = inject(Router);

  vehicles: AdminVehicle[] = [];
  isLoading: boolean = false;

  // Filter & Search States
  activeTab: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'ALL';
  searchTerm: string = '';

  // Detail & Document Inspection Modal
  selectedVehicle: AdminVehicle | null = null;
  showModal: boolean = false;
  activeDocPreview: { title: string; url: string; isImage: boolean } | null = null;

  // Rejection Reason Modal State
  showRejectModal: boolean = false;
  rejectingVehicle: AdminVehicle | null = null;
  rejectionReasonInput: string = '';

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.isLoading = true;
    this.vehicleService.getVehicles().subscribe({
      next: (list) => {
        this.isLoading = false;
        this.vehicles = list || [];
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading vehicles list', err);
      }
    });
  }

  // Status classification helpers
  isPending(status?: any): boolean {
    if (!status) return false;
    const s = String(status).toUpperCase();
    return s.includes('REVIEW') || s.includes('PENDING');
  }

  isApproved(status?: any): boolean {
    if (!status) return false;
    const s = String(status).toUpperCase();
    return s.includes('APPROV') || s === 'ACTIVE';
  }

  isRejected(status?: any): boolean {
    if (!status) return false;
    const s = String(status).toUpperCase();
    return s.includes('REJECT');
  }

  // KPI Metrics Calculation
  get totalVehicles(): number {
    return this.vehicles.length;
  }

  get pendingCount(): number {
    return this.vehicles.filter(v => this.isPending(v.status)).length;
  }

  get approvedCount(): number {
    return this.vehicles.filter(v => this.isApproved(v.status)).length;
  }

  get rejectedCount(): number {
    return this.vehicles.filter(v => this.isRejected(v.status)).length;
  }

  filteredVehicles(): AdminVehicle[] {
    return this.vehicles.filter(v => {
      // Tab filter
      if (this.activeTab === 'PENDING') {
        if (!this.isPending(v.status)) return false;
      } else if (this.activeTab === 'APPROVED') {
        if (!this.isApproved(v.status)) return false;
      } else if (this.activeTab === 'REJECTED') {
        if (!this.isRejected(v.status)) return false;
      }

      // Search term filter
      if (!this.searchTerm || !this.searchTerm.trim()) return true;
      const term = this.searchTerm.toLowerCase().trim();
      return (v.regNumber && v.regNumber.toLowerCase().includes(term)) ||
             (v.driverName && v.driverName.toLowerCase().includes(term)) ||
             (v.machineryModel && v.machineryModel.toLowerCase().includes(term)) ||
             (v.chassisVin && v.chassisVin.toLowerCase().includes(term)) ||
             (v.machineClass && v.machineClass.toLowerCase().includes(term));
    });
  }

  setTab(tab: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'): void {
    this.activeTab = tab;
  }

  openVehicleDetails(vehicle: AdminVehicle): void {
    this.selectedVehicle = vehicle;
    this.showModal = true;
    this.activeDocPreview = null;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedVehicle = null;
    this.activeDocPreview = null;
  }

  approveVehicle(vehicle: AdminVehicle, event?: Event): void {
    if (event) event.stopPropagation();
    this.vehicleService.approveVehicle(vehicle.id).subscribe({
      next: () => {
        this.toastService.showSuccess(`✓ Vehicle ${vehicle.regNumber} approved! Notification sent to driver.`);
        this.loadVehicles();
        if (this.selectedVehicle && this.selectedVehicle.id === vehicle.id) {
          this.selectedVehicle.status = 'APPROVED';
          this.selectedVehicle.isActive = true;
          this.selectedVehicle.rejectionReason = undefined;
        }
      }
    });
  }

  openRejectModal(vehicle: AdminVehicle, event?: Event): void {
    if (event) event.stopPropagation();
    this.rejectingVehicle = vehicle;
    this.rejectionReasonInput = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectingVehicle = null;
    this.rejectionReasonInput = '';
  }

  confirmRejection(): void {
    if (!this.rejectingVehicle) return;
    if (!this.rejectionReasonInput || !this.rejectionReasonInput.trim()) {
      this.toastService.showError('Please enter a rejection reason.');
      return;
    }

    const targetVehicle = this.rejectingVehicle;
    const reason = this.rejectionReasonInput.trim();

    this.vehicleService.rejectVehicle(targetVehicle.id, reason).subscribe({
      next: () => {
        this.toastService.showSuccess(`Vehicle ${targetVehicle.regNumber} rejected. Driver notified with reason.`);
        this.closeRejectModal();
        this.loadVehicles();
        if (this.selectedVehicle && this.selectedVehicle.id === targetVehicle.id) {
          this.selectedVehicle.status = 'REJECTED';
          this.selectedVehicle.isActive = false;
          this.selectedVehicle.rejectionReason = reason;
        }
      }
    });
  }

  previewDoc(title: string, url?: string): void {
    if (!url || !url.trim() || url.includes('unsplash.com')) {
      return;
    }

    const isImg = url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.jpeg') || url.startsWith('http') || url.startsWith('data:image') || url.startsWith('blob:');
    this.activeDocPreview = { title, url: url, isImage: isImg };
  }

  closeDocPreview(): void {
    this.activeDocPreview = null;
  }
}
