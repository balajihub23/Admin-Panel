import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DriverService, Driver } from '../../../shared/services/driver.service';
import { ContractorService, Contractor } from '../../../shared/services/contractor.service';
import { DocumentService, DocumentInfo } from '../../../shared/services/document.service';
import { FileUploaderComponent } from '../../../shared/components/file-uploader/file-uploader.component';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-driver-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FileUploaderComponent],
  templateUrl: './driver-list.component.html',
  styleUrl: './driver-list.component.scss'
})
export class DriverListComponent implements OnInit {
  private driverService = inject(DriverService);
  private contractorService = inject(ContractorService);
  private documentService = inject(DocumentService);

  drivers: Driver[] = [];
  contractors: Contractor[] = [];
  isLoading = true;
  isRefreshing = false;

  // Pagination fields
  currentPage = 1;
  pageSize = 5;

  // Verification queue documents map: driverId -> DocumentInfo[]
  documentsMap: { [key: number]: DocumentInfo[] } = {};

  // File variables
  selectedLicenseFile: File | null = null;
  selectedAadhaarFile: File | null = null;
  selectedPhotoFile: File | null = null;

  // Stats
  totalDrivers = 0;
  onlineDrivers = 0;
  busyDrivers = 0;
  pendingVerification = 0;
  approvedToday = 0;
  rejectedToday = 0;

  // View state: 'list' or 'queue'
  currentView: 'list' | 'queue' = 'list';

  // Filters
  searchQuery = '';
  selectedRatingFilter = 'All';
  selectedStatusFilter = 'All';

  // Add Driver Modal state
  isModalOpen = false;
  isSaving = false;
  formError = '';
  modalTitle = 'Add New Driver';
  editingDriver: Driver | null = null;

  // Form Fields
  formName = '';
  formPhone = '';
  formEmail = '';
  formLicense = '';
  formAadhaar = '';
  formExperience = '';

  // Selected Contractor ID field
  formContractorId: number | null = null;

  ngOnInit(): void {
    this.loadDrivers();
    this.loadContractors();
  }

  loadContractors(): void {
    this.contractorService.getContractors().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.contractors = res.data;
        }
      },
      error: (err) => console.error('Error loading contractors:', err)
    });
  }

  loadDrivers(): void {
    this.isLoading = true;
    this.driverService.getDrivers().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.drivers = res.data;
          this.calculateStats();
          this.loadDocumentsForPendingDrivers();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading drivers:', err);
      }
    });
  }

  loadDocumentsForPendingDrivers(): void {
    this.drivers.forEach(driver => {
      if (driver.id) {
        this.documentService.getDocumentsForEntity('DRIVER', driver.id).subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.documentsMap[driver.id!] = res.data;
            }
          },
          error: (err) => console.error('Error loading docs for driver: ' + driver.id, err)
        });
      }
    });
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.driverService.getDrivers().subscribe({
      next: (res) => {
        this.isRefreshing = false;
        if (res.success && res.data) {
          this.drivers = res.data;
          this.calculateStats();
          this.loadDocumentsForPendingDrivers();
        }
      },
      error: (err) => {
        this.isRefreshing = false;
        console.error('Error refreshing drivers:', err);
      }
    });
  }

  calculateStats(): void {
    this.totalDrivers = this.drivers.length;
    this.onlineDrivers = this.drivers.filter(d => d.status === 'ACTIVE' || d.status === 'ACTIVE_ONLINE').length;
    this.busyDrivers = this.drivers.filter(d => d.status === 'BUSY').length;
    this.pendingVerification = this.drivers.filter(d => d.status === 'PENDING_VERIFICATION').length;
    this.approvedToday = this.drivers.filter(d => d.status === 'ACTIVE').length;
    this.rejectedToday = this.drivers.filter(d => d.status === 'REJECTED').length;
  }

  toggleView(view: 'list' | 'queue'): void {
    this.currentView = view;
    this.currentPage = 1; // reset page when view switches
    if (view === 'queue') {
      // Always reload documents fresh when entering the verification queue
      this.loadDocumentsForPendingDrivers();
    }
  }

  get paginatedDrivers(): Driver[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDrivers.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredDrivers.length / this.pageSize) || 1;
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  get filteredDrivers(): Driver[] {
    // Show only verified/approved ones in standard list, show pending/rejected in queue
    let list = this.drivers;

    if (this.currentView === 'list') {
      // In the main list, show all drivers
      list = this.drivers;
    } else {
      // Verification queue shows PENDING_VERIFICATION applications
      list = this.drivers.filter(d => d.status === 'PENDING_VERIFICATION' || d.status === 'REJECTED');
    }

    // Text Search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(d =>
        d.fullName.toLowerCase().includes(q) ||
        (d.email && d.email.toLowerCase().includes(q)) ||
        d.phone.includes(q) ||
        (d.licenseNumber && d.licenseNumber.toLowerCase().includes(q))
      );
    }

    // Status Filter
    if (this.selectedStatusFilter !== 'All') {
      list = list.filter(d => d.status === this.selectedStatusFilter);
    }

    // Rating Filter
    if (this.selectedRatingFilter !== 'All') {
      const minRating = parseFloat(this.selectedRatingFilter);
      list = list.filter(d => d.rating && d.rating >= minRating);
    }

    return list;
  }

  // ── Application Actions ──────────────────────────────────────────────────────
  approveDriver(id: number, event: Event): void {
    event.stopPropagation();
    this.driverService.approveDriver(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadDrivers();
        } else {
          alert('Failed to approve driver: ' + res.message);
        }
      },
      error: (err) => {
        console.error('Error approving driver:', err);
        alert(err.error?.message || 'Error occurred');
      }
    });
  }

  rejectDriver(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to reject this driver application?')) {
      this.driverService.rejectDriver(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadDrivers();
          } else {
            alert('Failed to reject: ' + res.message);
          }
        },
        error: (err) => {
          console.error(err);
          alert('Error occurred');
        }
      });
    }
  }

  // Preloaded documents state for Edit modal
  editLicenseDoc: DocumentInfo | null = null;
  editAadhaarDoc: DocumentInfo | null = null;
  editPhotoDoc: DocumentInfo | null = null;


  // ── Modal CRUD Form ─────────────────────────────────────────────────────────
  openAddModal(): void {
    this.modalTitle = 'Add New Driver';
    this.editingDriver = null;
    this.resetForm();
    this.isModalOpen = true;
  }

  openEditModal(driver: Driver, event: Event): void {
    event.stopPropagation();
    this.modalTitle = 'Edit Driver Details';
    this.editingDriver = driver;
    this.formName = driver.fullName;
    this.formPhone = driver.phone;
    this.formEmail = driver.email || '';
    this.formLicense = driver.licenseNumber || '';
    this.formAadhaar = driver.aadhaarNumber || '';
    this.formExperience = driver.experience || '';
    this.formContractorId = driver.contractorId ?? null;
    this.formError = '';
    this.editLicenseDoc = null;
    this.editAadhaarDoc = null;
    this.editPhotoDoc = null;
    this.uploadedDocIds = [];
    this.isModalOpen = true;

    // Directly fetch documents from server to ensure they are loaded
    if (driver.id) {
      this.documentService.getDocumentsForEntity('DRIVER', driver.id).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const docList: DocumentInfo[] = res.data;
            this.documentsMap[driver.id!] = docList;
            this.editLicenseDoc = docList.find(d => d.documentType === 'DRIVING_LICENSE') || null;
            this.editAadhaarDoc = docList.find(d => d.documentType === 'AADHAAR_CARD') || null;
            this.editPhotoDoc = docList.find(d => d.documentType === 'PHOTO') || null;
          }
        },
        error: (err) => console.error('Error loading docs for edit modal:', err)
      });
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  uploadedDocIds: number[] = [];

  onUploadSuccess(docId: number): void {
    if (!this.uploadedDocIds.includes(docId)) {
      this.uploadedDocIds.push(docId);
    }
  }

  onDocCleared(docId: number): void {
    this.uploadedDocIds = this.uploadedDocIds.filter(id => id !== docId);
    // Also remove from editing state if it matched a preloaded doc
    if (this.editLicenseDoc && this.editLicenseDoc.id === docId) {
      this.editLicenseDoc = null;
    }
    if (this.editAadhaarDoc && this.editAadhaarDoc.id === docId) {
      this.editAadhaarDoc = null;
    }
    if (this.editPhotoDoc && this.editPhotoDoc.id === docId) {
      this.editPhotoDoc = null;
    }
  }

  resetForm(): void {
    this.formName = '';
    this.formPhone = '';
    this.formEmail = '';
    this.formLicense = '';
    this.formAadhaar = '';
    this.formExperience = '';
    this.formContractorId = null;
    this.uploadedDocIds = [];
    this.editLicenseDoc = null;
    this.editAadhaarDoc = null;
    this.editPhotoDoc = null;
    this.formError = '';
  }

  onSubmit(): void {
    if (!this.formName.trim() || !this.formPhone.trim()) {
      this.formError = 'Driver Name and Phone Number are required.';
      return;
    }

    this.isSaving = true;
    this.formError = '';

    const payload: Driver = {
      id: this.editingDriver ? this.editingDriver.id : undefined,
      fullName: this.formName.trim(),
      phone: this.formPhone.trim(),
      email: this.formEmail.trim() || undefined,
      licenseNumber: this.formLicense.trim() || undefined,
      aadhaarNumber: this.formAadhaar.trim() || undefined,
      experience: this.formExperience.trim() || undefined,
      contractorId: this.formContractorId || undefined,
      status: this.editingDriver ? this.editingDriver.status : 'PENDING_VERIFICATION'
    };

    this.driverService.saveDriver(payload).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const savedDriverId = res.data.id;
          
          if (this.uploadedDocIds.length > 0) {
            this.documentService.associateDocuments(this.uploadedDocIds, 'DRIVER', savedDriverId).subscribe({
              next: () => {
                this.isSaving = false;
                this.loadDrivers();
                this.closeModal();
              },
              error: (assocErr) => {
                this.isSaving = false;
                this.formError = 'Driver saved, but document association failed: ' + (assocErr.error?.message || assocErr.message);
                this.loadDrivers();
              }
            });
          } else {
            this.isSaving = false;
            this.loadDrivers();
            this.closeModal();
          }
        } else {
          this.isSaving = false;
          this.formError = res.message || 'Failed to save driver';
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.formError = err.error?.message || 'Error occurred while saving driver';
      }
    });
  }

  deleteDriver(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this driver record?')) {
      this.driverService.deleteDriver(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadDrivers();
          } else {
            alert('Failed to delete: ' + res.message);
          }
        },
        error: (err) => {
          console.error(err);
          alert('Error occurred');
        }
      });
    }
  }

  getDocForDriver(driverId: number, docType: string): DocumentInfo | undefined {
    const list = this.documentsMap[driverId];
    return list ? list.find(d => d.documentType === docType) : undefined;
  }

  getDownloadUrl(doc: DocumentInfo | null | undefined): string {
    return doc ? this.documentService.downloadDocumentUrl(doc.id) : '';
  }
}
