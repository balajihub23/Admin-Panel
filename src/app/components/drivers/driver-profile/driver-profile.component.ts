import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DriverService, Driver } from '../../../shared/services/driver.service';
import { DocumentService, DocumentInfo } from '../../../shared/services/document.service';
import { BookingService } from '../../../shared/services/booking.service';
import { ToastService } from '../../../shared/services/toast.service';
import { VehicleService, AdminVehicle } from '../../../shared/services/vehicle.service';
import { environment } from '../../../../environments/environment';

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
  private http = inject(HttpClient);
  private driverService = inject(DriverService);
  private documentService = inject(DocumentService);
  private bookingService = inject(BookingService);
  private toastService = inject(ToastService);
  private vehicleService = inject(VehicleService);

  driverId = 0;
  driver: Driver | null = null;
  isLoading = true;
  documents: DocumentInfo[] = [];

  // Driver Vehicles & Pending Verification State
  driverVehicles: AdminVehicle[] = [];
  pendingVehicles: AdminVehicle[] = [];
  hasPendingVehicle = false;
  selectedVehicleForReview: AdminVehicle | null = null;
  showVehicleReviewModal = false;

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
          this.loadDriverVehicles();
          this.loadDriverJobs();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading driver profile:', err);
      }
    });
  }

  loadDriverVehicles(): void {
    const dId = this.driverId;
    const uId = this.driver?.userId;
    const url = `${environment.serverApi}/api/v1/vehicles/driver/${dId}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        let list: any[] = res?.data || [];
        if ((!list || list.length === 0) && uId) {
          this.http.get<any>(`${environment.serverApi}/api/v1/vehicles/user/${uId}`).subscribe({
            next: (uRes) => this.processDriverVehicles(uRes?.data || []),
            error: () => this.processDriverVehicles([])
          });
        } else {
          this.processDriverVehicles(list);
        }
      },
      error: (err) => {
        console.warn('Error loading driver vehicles:', err);
        if (uId) {
          this.http.get<any>(`${environment.serverApi}/api/v1/vehicles/user/${uId}`).subscribe({
            next: (uRes) => this.processDriverVehicles(uRes?.data || []),
            error: () => this.processDriverVehicles([])
          });
        }
      }
    });
  }

  processDriverVehicles(rawVehicles: any[]): void {
    const isValidUrl = (u: any) => u && typeof u === 'string' && u.trim().length > 0 && !u.includes('unsplash.com');

    this.driverVehicles = (rawVehicles || []).map((item: any) => ({
      id: item.id,
      regNumber: item.regNumber || '',
      vehicleName: item.vehicleName || item.machineryModel || 'Vehicle',
      category: item.category || 'Machinery',
      machineryModel: item.machineryModel || item.vehicleName || '',
      machinerySubCategory: item.machinerySubCategory || '',
      experience: item.experience || '',
      driverName: item.driverName || this.driver?.fullName || 'Driver Partner',
      driverPhone: item.driverPhone || this.driver?.phone || '',
      driverId: item.driverId || this.driverId,
      mfgYear: item.mfgYear || '',
      machineClass: item.machineClass || '',
      chassisVin: item.chassisVin || '',
      engineSerial: item.engineSerial || '',
      powertrain: item.powertrain || 'DIESEL',
      status: item.status || 'UNDER_REVIEW',
      isActive: item.isActive ?? false,
      rejectionReason: item.rejectionReason,
      fetchMode: item.fetchMode || 'MANUAL',
      isVahanSynced: item.isVahanSynced ?? false,
      submittedOn: item.submittedOn || '',
      vehicleDescription: item.vehicleDescription || '',
      documents: {
        rcFront: { name: 'RC_Front.png', url: isValidUrl(item.rcFrontUrl) ? item.rcFrontUrl : '', status: isValidUrl(item.rcFrontUrl) ? 'VERIFIED' : 'NOT_UPLOADED' },
        rcBack: { name: 'RC_Back.png', url: isValidUrl(item.rcBackUrl) ? item.rcBackUrl : '', status: isValidUrl(item.rcBackUrl) ? 'VERIFIED' : 'NOT_UPLOADED' },
        insurance: { name: 'Insurance_Policy.pdf', url: isValidUrl(item.insuranceUrl) ? item.insuranceUrl : '', status: isValidUrl(item.insuranceUrl) ? 'VERIFIED' : 'NOT_UPLOADED' },
        photos: {
          front: isValidUrl(item.frontPhotoUrl) ? item.frontPhotoUrl : '',
          side: isValidUrl(item.sidePhotoUrl) ? item.sidePhotoUrl : '',
          rear: isValidUrl(item.rearPhotoUrl) ? item.rearPhotoUrl : '',
          cabin: isValidUrl(item.cabinPhotoUrl) ? item.cabinPhotoUrl : '',
          engineSerialPlate: isValidUrl(item.enginePlatePhotoUrl) ? item.enginePlatePhotoUrl : ''
        }
      }
    }));

    const isPending = (st: string) => {
      const s = (st || '').toUpperCase();
      return s === 'UNDER_REVIEW' || s === 'PENDING' || s === 'PENDING_VERIFICATION';
    };

    this.pendingVehicles = this.driverVehicles.filter(v => isPending(v.status));
    this.hasPendingVehicle = this.pendingVehicles.length > 0;
  }

  openPendingVehicleReview(v?: AdminVehicle): void {
    this.selectedVehicleForReview = v || (this.pendingVehicles.length > 0 ? this.pendingVehicles[0] : (this.driverVehicles[0] || null));
    this.showVehicleReviewModal = true;
  }

  closeVehicleReviewModal(): void {
    this.showVehicleReviewModal = false;
    this.selectedVehicleForReview = null;
  }

  approveVehicleAction(v: AdminVehicle): void {
    if (!v) return;
    this.vehicleService.approveVehicle(v.id).subscribe({
      next: () => {
        v.status = 'APPROVED';
        v.isActive = true;
        this.toastService.showSuccess(`✓ Vehicle ${v.regNumber || v.vehicleName} approved successfully!`);
        this.closeVehicleReviewModal();
        this.loadDriverVehicles();
      },
      error: (err) => this.toastService.showError('Error approving vehicle: ' + (err.error?.message || err.message))
    });
  }

  rejectVehicleAction(v: AdminVehicle): void {
    if (!v) return;
    const reason = prompt('Please enter reason for vehicle rejection:', 'Vehicle registration or chassis documents need resubmission') || 'Incomplete details';
    this.vehicleService.rejectVehicle(v.id, reason).subscribe({
      next: () => {
        v.status = 'REJECTED';
        v.isActive = false;
        v.rejectionReason = reason;
        this.toastService.showSuccess(`Vehicle ${v.regNumber || v.vehicleName} rejected.`);
        this.closeVehicleReviewModal();
        this.loadDriverVehicles();
      },
      error: (err) => this.toastService.showError('Error rejecting vehicle: ' + (err.error?.message || err.message))
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
    if (url) {
      window.open(url, '_blank');
    }
  }

  isImageDocument(doc: any): boolean {
    if (!doc) return false;
    const fType = (doc.fileType || '').toLowerCase();
    const fName = (doc.fileName || '').toLowerCase();
    const url = (doc.url || '').toLowerCase();
    return fType.includes('image') || fType.includes('jpg') || fType.includes('png') || fType.includes('jpeg') ||
           fName.endsWith('.jpg') || fName.endsWith('.jpeg') || fName.endsWith('.png') || fName.endsWith('.webp') ||
           url.startsWith('data:image') || url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.jpeg') || url.endsWith('.webp');
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
    if (doc.url) return doc.url;
    return this.documentService.downloadDocumentUrl(doc.id);
  }

  isVehiclePending(status?: string): boolean {
    const s = (status || '').toUpperCase();
    return s === 'UNDER_REVIEW' || s === 'PENDING' || s === 'PENDING_VERIFICATION';
  }
}
