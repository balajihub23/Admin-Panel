import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContractorService, Contractor } from '../../../shared/services/contractor.service';
import { DocumentService, DocumentInfo } from '../../../shared/services/document.service';
import { BookingService } from '../../../shared/services/booking.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-contractor-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contractor-profile.component.html',
  styleUrl: './contractor-profile.component.scss'
})
export class ContractorProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contractorService = inject(ContractorService);
  private documentService = inject(DocumentService);
  private bookingService = inject(BookingService);
  private toastService = inject(ToastService);

  contractorId = 0;
  contractor: Contractor | null = null;
  isLoading = true;
  documents: DocumentInfo[] = [];

  // Document Preview Modal state
  selectedDocumentForPreview: any = null;
  showDocumentPreviewModal = false;

  // Jobs and Assigned Drivers Data
  jobs: any[] = [];
  assignedDrivers: any[] = [];

  // Metrics
  totalContractorJobs = 0;
  completedJobs = 0;
  linkedDriversCount = 0;
  performanceRating = 4.0;

  // Pagination state for Drivers Table
  driverPage = 1;
  driverPageSize = 5;

  // Pagination state for Jobs Table
  jobPage = 1;
  jobPageSize = 5;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.contractorId = parseInt(idParam);
      this.loadContractorDetails();
    } else {
      this.router.navigate(['/contractors']);
    }
  }

  loadContractorDetails(): void {
    this.isLoading = true;
    this.contractorService.getContractorById(this.contractorId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          const data: any = res.data;
          this.contractor = data;
          this.assignedDrivers = data.assignedDrivers || [];
          this.linkedDriversCount = this.assignedDrivers.length;
          this.performanceRating = data.rating || 4.0;
          
          this.loadDocuments();
          this.loadContractorJobs();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading contractor profile:', err);
      }
    });
  }

  loadDocuments(): void {
    this.documentService.getDocumentsForEntity('CONTRACTOR', this.contractorId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.documents = res.data;
        }
      },
      error: (err) => console.error('Error loading documents:', err)
    });
  }

  // Document Preview Popup Methods
  openDocumentPreview(doc: any): void {
    this.selectedDocumentForPreview = doc;
    this.showDocumentPreviewModal = true;
  }

  closeDocumentPreview(): void {
    this.showDocumentPreviewModal = false;
    this.selectedDocumentForPreview = null;
  }

  downloadSelectedDocument(): void {
    if (!this.selectedDocumentForPreview) return;
    const url = this.getDownloadUrl(this.selectedDocumentForPreview);
    window.open(url, '_blank');
  }

  isImageDocument(doc: any): boolean {
    if (!doc) return false;
    const fType = (doc.fileType || '').toLowerCase();
    const fName = (doc.fileName || '').toLowerCase();
    return fType.includes('image') || fType.includes('jpg') || fType.includes('png') || fType.includes('jpeg') ||
           fName.endsWith('.jpg') || fName.endsWith('.jpeg') || fName.endsWith('.png') || fName.endsWith('.webp');
  }

  formatDocumentTypeName(typeStr: string): string {
    if (!typeStr) return 'Document';
    return typeStr.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  loadContractorJobs(): void {
    this.bookingService.getBookingsByContractorId(this.contractorId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.jobs = res.data || [];
          this.totalContractorJobs = this.jobs.length;
          this.completedJobs = this.jobs.filter(j => j.status === 'COMPLETED').length;
        }
      },
      error: (err) => console.error('Error loading contractor jobs:', err)
    });
  }

  // Drivers Pagination logic
  get totalDriverPages(): number {
    return Math.ceil(this.assignedDrivers.length / this.driverPageSize) || 1;
  }

  paginatedDrivers(): any[] {
    const start = (this.driverPage - 1) * this.driverPageSize;
    return this.assignedDrivers.slice(start, start + this.driverPageSize);
  }

  goToDriverPage(page: number): void {
    if (page >= 1 && page <= this.totalDriverPages) {
      this.driverPage = page;
    }
  }

  previousDriverPage(): void {
    if (this.driverPage > 1) {
      this.driverPage--;
    }
  }

  nextDriverPage(): void {
    if (this.driverPage < this.totalDriverPages) {
      this.driverPage++;
    }
  }

  // Jobs Pagination logic
  get totalJobPages(): number {
    return Math.ceil(this.jobs.length / this.jobPageSize) || 1;
  }

  paginatedJobs(): any[] {
    const start = (this.jobPage - 1) * this.jobPageSize;
    return this.jobs.slice(start, start + this.jobPageSize);
  }

  goToJobPage(page: number): void {
    if (page >= 1 && page <= this.totalJobPages) {
      this.jobPage = page;
    }
  }

  previousJobPage(): void {
    if (this.jobPage > 1) {
      this.jobPage--;
    }
  }

  nextJobPage(): void {
    if (this.jobPage < this.totalJobPages) {
      this.jobPage++;
    }
  }

  approveContractor(): void {
    if (!this.contractor) return;
    this.contractorService.approveContractor(this.contractorId).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess('✓ Contractor approved successfully!');
          this.loadContractorDetails();
        } else {
          this.toastService.showError('Error: ' + res.message);
        }
      },
      error: (err) => this.toastService.showError(err.error?.message || 'Error occurred during approval')
    });
  }

  suspendAccount(): void {
    if (!this.contractor) return;
    if (confirm('Are you sure you want to suspend this contractor account? The user will be unable to log in.')) {
      this.contractorService.suspendContractor(this.contractorId).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.showSuccess('✓ Contractor account suspended.');
            this.loadContractorDetails();
          } else {
            this.toastService.showError('Error suspending account: ' + res.message);
          }
        },
        error: (err) => this.toastService.showError(err.error?.message || 'Error occurred during suspension')
      });
    }
  }

  unsuspendAccount(): void {
    if (!this.contractor) return;
    this.contractorService.unsuspendContractor(this.contractorId).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess('✓ Contractor account reactivated.');
          this.loadContractorDetails();
        } else {
          this.toastService.showError('Error unsuspending account: ' + res.message);
        }
      },
      error: (err) => this.toastService.showError(err.error?.message || 'Error occurred during activation')
    });
  }

  getDownloadUrl(doc: any): string {
    if (!doc) return '';
    return this.documentService.downloadDocumentUrl(doc.id);
  }
}
