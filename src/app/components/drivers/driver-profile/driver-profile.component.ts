import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DriverService, Driver } from '../../../shared/services/driver.service';
import { DocumentService, DocumentInfo } from '../../../shared/services/document.service';
import { BookingService } from '../../../shared/services/booking.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-driver-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './driver-profile.component.html',
  styleUrl: './driver-profile.component.scss'
})
export class DriverProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private driverService = inject(DriverService);
  private documentService = inject(DocumentService);
  private bookingService = inject(BookingService);
  private toastService = inject(ToastService);

  driverId = 0;
  driver: Driver | null = null;
  isLoading = true;
  documents: DocumentInfo[] = [];

  // Document Preview Modal state
  selectedDocumentForPreview: any = null;
  showDocumentPreviewModal = false;

  // Stats
  totalJobsCount = 0;
  completedJobs = 0;
  cancelledJobs = 0;
  totalEarnings = 0;

  // Real Job History
  jobs: any[] = [];

  // Pagination for Jobs
  jobPage = 1;
  jobPageSize = 5;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.driverId = parseInt(idParam);
      this.loadDriverDetails();
    } else {
      this.router.navigate(['/drivers']);
    }
  }

  loadDriverDetails(): void {
    this.isLoading = true;
    this.driverService.getDriverById(this.driverId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.driver = res.data;
          this.loadDocuments();
          this.loadDriverJobs();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading driver profile:', err);
      }
    });
  }

  loadDocuments(): void {
    this.documentService.getDocumentsForEntity('DRIVER', this.driverId).subscribe({
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

  loadDriverJobs(): void {
    this.bookingService.getBookingsByDriverId(this.driverId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.jobs = res.data || [];
          this.totalJobsCount = this.jobs.length;
          this.completedJobs = this.jobs.filter(j => j.status === 'COMPLETED').length;
          this.cancelledJobs = this.jobs.filter(j => j.status === 'CANCELLED' || j.status === 'REJECTED').length;
          this.totalEarnings = this.jobs
            .filter(j => j.status === 'COMPLETED')
            .reduce((sum, j) => sum + (j.driverAmount || j.totalAmount || 0), 0);
        }
      },
      error: (err) => console.error('Error loading driver jobs:', err)
    });
  }

  // Pagination logic for driver jobs
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

  approveDriver(): void {
    if (!this.driver) return;
    this.driverService.approveDriver(this.driverId).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess('✓ Driver approved successfully!');
          this.loadDriverDetails();
        } else {
          this.toastService.showError('Error: ' + res.message);
        }
      },
      error: (err) => this.toastService.showError(err.error?.message || 'Error occurred during approval')
    });
  }

  suspendAccount(): void {
    if (!this.driver) return;
    if (confirm('Are you sure you want to suspend this driver account? The user will be unable to log in.')) {
      this.driverService.suspendDriver(this.driverId).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.showSuccess('✓ Driver account suspended.');
            this.loadDriverDetails();
          } else {
            this.toastService.showError('Error suspending account: ' + res.message);
          }
        },
        error: (err) => this.toastService.showError(err.error?.message || 'Error occurred during suspension')
      });
    }
  }

  unsuspendAccount(): void {
    if (!this.driver) return;
    this.driverService.unsuspendDriver(this.driverId).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess('✓ Driver account reactivated.');
          this.loadDriverDetails();
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
