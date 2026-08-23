import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PartnerService } from '../../../shared/services/partner.service';
import { ContractorService } from '../../../shared/services/contractor.service';
import { DriverService } from '../../../shared/services/driver.service';
import { DocumentService } from '../../../shared/services/document.service';

import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-partner-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partner-list.component.html',
  styleUrls: ['./partner-list.component.scss']
})
export class PartnerListComponent implements OnInit {
  private partnerService = inject(PartnerService);
  private contractorService = inject(ContractorService);
  private driverService = inject(DriverService);
  private documentService = inject(DocumentService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // View state
  viewMode: 'LIST' | 'QUEUE' = 'LIST';
  activeTab: 'ALL' | 'CONTRACTOR' | 'DRIVER' = 'ALL';
  searchTerm: string = '';
  statusFilter: string = 'ALL';
  ratingFilter: number = 0;

  // Pagination state
  currentPage: number = 1;
  pageSize: number = 10;

  contractors: any[] = [];
  drivers: any[] = [];
  combinedPartners: any[] = [];
  verificationQueue: any[] = [];

  // Metric KPI Stats
  stats = {
    totalPartners: 0,
    totalContractors: 0,
    totalDrivers: 0,
    onlineDrivers: 0,
    busyDrivers: 0,
    pendingVerification: 0,
    approvedToday: 0,
    rejectedToday: 0
  };

  selectedContractor: any = null;
  showContractorModal = false;

  showAssignModal = false;
  selectedDriverToAssign: any = null;
  targetContractorId: number | null = null;

  // Add Partner Modal state & document uploads
  showAddModal = false;
  newPartner: any = this.initNewPartner();
  selectedFiles: { [key: string]: File } = {};

  // Document Preview Modal State
  showDocumentPreviewModal = false;
  selectedDocumentForPreview: any = null;
  previewPartnerName: string = '';

  isLoading = false;

  ngOnInit(): void {
    this.loadPartners();
  }

  initNewPartner(): any {
    return {
      partnerType: 'DRIVER',
      fullName: '',
      phone: '',
      email: '',
      password: '',
      experience: '2 years',
      companyName: '',
      gstNumber: '',
      licenseNumber: '',
      aadhaarNumber: '',
      contractorId: null,
      status: 'PENDING_VERIFICATION'
    };
  }

  dateFilter = '';

  loadPartners(): void {
    this.isLoading = true;
    this.partnerService.getPartners().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.contractors = res.data.contractors || [];
          this.drivers = res.data.drivers || [];
          if (res.data.stats) {
            this.stats = { ...this.stats, ...res.data.stats };
          }
          this.buildCombinedList();
          this.calculateStats();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load partners', err);
      }
    });

    this.loadVerificationQueue();
  }

  loadVerificationQueue(): void {
    const statusParam = this.statusFilter ? this.statusFilter : 'ALL';
    this.partnerService.getVerificationQueue(statusParam, this.dateFilter).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.verificationQueue = res.data;
        }
      },
      error: (err) => console.error('Failed to load verification queue', err)
    });
  }

  calculateStats(): void {
    const totalContractors = this.contractors.length;
    const totalDrivers = this.drivers.length;
    const totalPartners = totalContractors + totalDrivers;
    
    const activePartners = this.combinedPartners.filter(p => 
      p.status === 'ACTIVE' || p.status === 'ONLINE' || p.status === 'ACTIVE_ONLINE'
    ).length;
    
    const busyDrivers = this.combinedPartners.filter(p => p.status === 'BUSY').length;
    const pendingCount = this.combinedPartners.filter(p => p.status === 'PENDING_VERIFICATION').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const approvedTodayCount = this.combinedPartners.filter(p => 
      (p.status === 'ACTIVE' || p.status === 'ONLINE') && 
      ((p.updatedAt && p.updatedAt.startsWith(todayStr)) || (p.createdAt && p.createdAt.startsWith(todayStr)))
    ).length;

    const rejectedTodayCount = this.combinedPartners.filter(p => 
      p.status === 'REJECTED' && 
      ((p.updatedAt && p.updatedAt.startsWith(todayStr)) || (p.createdAt && p.createdAt.startsWith(todayStr)))
    ).length;

    this.stats.totalPartners = totalPartners;
    this.stats.totalContractors = totalContractors;
    this.stats.totalDrivers = totalDrivers;
    this.stats.onlineDrivers = activePartners;
    this.stats.busyDrivers = busyDrivers;
    this.stats.pendingVerification = pendingCount;
    this.stats.approvedToday = approvedTodayCount || this.stats.approvedToday || 0;
    this.stats.rejectedToday = rejectedTodayCount || this.stats.rejectedToday || 0;
  }

  filterByCard(status: string, filterTodayDate: boolean = false): void {
    this.statusFilter = status;
    if (filterTodayDate) {
      this.dateFilter = new Date().toISOString().split('T')[0];
    } else {
      this.dateFilter = '';
    }
    this.currentPage = 1;
    if (this.viewMode === 'QUEUE') {
      this.loadVerificationQueue();
    }
  }

  resetFilters(): void {
    this.statusFilter = 'ALL';
    this.dateFilter = '';
    this.searchTerm = '';
    this.ratingFilter = 0;
    this.currentPage = 1;
    if (this.viewMode === 'QUEUE') {
      this.loadVerificationQueue();
    }
  }

  toggleViewMode(mode: 'LIST' | 'QUEUE'): void {
    this.viewMode = mode;
    if (mode === 'QUEUE') {
      this.loadVerificationQueue();
    }
  }

  setTab(tab: 'ALL' | 'CONTRACTOR' | 'DRIVER'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.buildCombinedList();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    if (this.viewMode === 'QUEUE') {
      this.loadVerificationQueue();
    }
  }

  buildCombinedList(): void {
    let list: any[] = [];
    if (this.activeTab === 'ALL' || this.activeTab === 'CONTRACTOR') {
      this.contractors.forEach(c => list.push({ ...c, partnerType: 'CONTRACTOR' }));
    }
    if (this.activeTab === 'ALL' || this.activeTab === 'DRIVER') {
      this.drivers.forEach(d => list.push({ ...d, partnerType: 'DRIVER' }));
    }
    this.combinedPartners = list;
  }

  filteredPartners(): any[] {
    return this.combinedPartners.filter(p => {
      // Search filter
      const term = this.searchTerm ? this.searchTerm.toLowerCase() : '';
      const matchesSearch = !term ||
        (p.fullName && p.fullName.toLowerCase().includes(term)) ||
        (p.phone && p.phone.includes(term)) ||
        (p.email && p.email.toLowerCase().includes(term)) ||
        (p.companyName && p.companyName.toLowerCase().includes(term));

      // Status filter
      let matchesStatus = true;
      if (this.statusFilter !== 'ALL') {
        const sf = this.statusFilter.toUpperCase();
        if (sf === 'ACTIVE') {
          matchesStatus = p.status === 'ACTIVE' || p.status === 'ONLINE' || p.status === 'ACTIVE_ONLINE';
        } else if (sf === 'INACTIVE') {
          matchesStatus = p.status === 'SUSPENDED' || p.status === 'INACTIVE';
        } else {
          matchesStatus = (p.status || '').toUpperCase() === sf;
        }
      }

      // Rating filter
      let matchesRating = true;
      if (this.ratingFilter > 0) {
        matchesRating = (p.rating || 0) >= this.ratingFilter;
      }

      // Date filter
      let matchesDate = true;
      if (this.dateFilter) {
        const cDate = p.createdAt ? p.createdAt.split('T')[0] : '';
        const uDate = p.updatedAt ? p.updatedAt.split('T')[0] : '';
        matchesDate = cDate === this.dateFilter || uDate === this.dateFilter;
      }

      return matchesSearch && matchesStatus && matchesRating && matchesDate;
    });
  }

  // Pagination Logic
  get totalRecords(): number {
    return this.filteredPartners().length;
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize) || 1;
  }

  paginatedPartners(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredPartners().slice(startIndex, startIndex + this.pageSize);
  }

  pagesList(): number[] {
    const total = this.totalPages;
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  openAddModal(): void {
    this.newPartner = this.initNewPartner();
    this.selectedFiles = {};
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.selectedFiles = {};
  }

  onFileSelected(event: any, docType: string): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFiles[docType] = file;
    }
  }

  saveNewPartner(): void {
    if (!this.newPartner.fullName || !this.newPartner.phone || !this.newPartner.password) {
      this.toastService.showError('Full Name, Phone Number, and Password are required.');
      return;
    }

    this.isLoading = true;
    this.partnerService.registerPartner(this.newPartner).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const partnerId = res.data.id;
          const partnerType = this.newPartner.partnerType || 'DRIVER';

          const fileKeys = Object.keys(this.selectedFiles);
          if (fileKeys.length === 0) {
            this.isLoading = false;
            this.toastService.showSuccess('✓ Partner registered successfully!');
            this.closeAddModal();
            this.loadPartners();
            return;
          }

          const uploadPromises: Promise<any>[] = [];
          fileKeys.forEach(docType => {
            const file = this.selectedFiles[docType];
            if (file) {
              uploadPromises.push(
                this.documentService.uploadDocument(file, partnerType, partnerId, docType).toPromise()
              );
            }
          });

          Promise.all(uploadPromises).then(() => {
            this.isLoading = false;
            this.toastService.showSuccess('✓ Partner registered and documents uploaded successfully!');
            this.closeAddModal();
            this.loadPartners();
          }).catch(err => {
            this.isLoading = false;
            console.error('Error uploading documents:', err);
            this.toastService.showSuccess('✓ Partner registered successfully!');
            this.closeAddModal();
            this.loadPartners();
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.showError(err.error?.message || 'Registration failed');
      }
    });
  }

  // Document Preview Popup Methods
  openDocumentPreview(doc: any, partnerName: string): void {
    this.selectedDocumentForPreview = doc;
    this.previewPartnerName = partnerName;
    this.showDocumentPreviewModal = true;
  }

  closeDocumentPreview(): void {
    this.showDocumentPreviewModal = false;
    this.selectedDocumentForPreview = null;
  }

  downloadSelectedDocument(): void {
    if (!this.selectedDocumentForPreview) return;
    const url = this.getDocumentUrl(this.selectedDocumentForPreview.id);
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

  navigateToProfile(partner: any): void {
    if (partner.partnerType === 'CONTRACTOR') {
      this.router.navigate(['/contractors', partner.id]);
    } else {
      this.router.navigate(['/drivers', partner.id]);
    }
  }

  viewContractorDetails(contractor: any): void {
    this.selectedContractor = contractor;
    this.showContractorModal = true;
  }

  closeContractorModal(): void {
    this.showContractorModal = false;
    this.selectedContractor = null;
  }

  openAssignModal(driver: any): void {
    this.selectedDriverToAssign = driver;
    this.targetContractorId = driver.contractorId || null;
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedDriverToAssign = null;
    this.targetContractorId = null;
  }

  assignDriver(): void {
    if (!this.selectedDriverToAssign) return;
    this.partnerService.assignDriverToContractor(this.selectedDriverToAssign.id, this.targetContractorId).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess('✓ Driver assignment updated successfully');
          this.closeAssignModal();
          this.loadPartners();
        }
      },
      error: (err) => this.toastService.showError(err.error?.message || 'Assignment failed')
    });
  }

  approvePartner(partner: any): void {
    if (partner.isProcessing || partner.status === 'ACTIVE') return;
    partner.isProcessing = true;
    const type = partner.partnerType || (partner.companyName ? 'CONTRACTOR' : 'DRIVER');
    this.partnerService.approvePartner(partner.id, type).subscribe({
      next: (res) => {
        partner.isProcessing = false;
        if (res.success) {
          partner.status = 'ACTIVE';
          this.toastService.showSuccess('✓ Partner approved! User login account activated.');
          this.stats.approvedToday++;
          this.loadPartners();
        }
      },
      error: (err) => {
        partner.isProcessing = false;
        this.toastService.showError(err.error?.message || 'Approval failed');
      }
    });
  }

  rejectPartner(partner: any): void {
    const type = partner.partnerType || (partner.companyName ? 'CONTRACTOR' : 'DRIVER');
    this.partnerService.rejectPartner(partner.id, type).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess('✓ Partner application rejected.');
          this.stats.rejectedToday++;
          this.loadPartners();
        }
      },
      error: (err) => this.toastService.showError(err.error?.message || 'Rejection failed')
    });
  }

  suspendPartner(partner: any): void {
    if (confirm(`Are you sure you want to suspend ${partner.fullName}?`)) {
      partner.isProcessing = true;
      const obs = partner.partnerType === 'CONTRACTOR'
        ? this.contractorService.suspendContractor(partner.id)
        : this.driverService.suspendDriver(partner.id);

      obs.subscribe({
        next: () => {
          partner.isProcessing = false;
          partner.status = 'SUSPENDED';
          this.toastService.showSuccess('✓ Partner account suspended.');
          this.loadPartners();
        },
        error: (err) => {
          partner.isProcessing = false;
          this.toastService.showError(err.error?.message || 'Failed to suspend partner.');
        }
      });
    }
  }

  unsuspendPartner(partner: any): void {
    partner.isProcessing = true;
    const obs = partner.partnerType === 'CONTRACTOR'
      ? this.contractorService.unsuspendContractor(partner.id)
      : this.driverService.unsuspendDriver(partner.id);

    obs.subscribe({
      next: () => {
        partner.isProcessing = false;
        partner.status = 'ACTIVE';
        this.toastService.showSuccess('✓ Partner account reactivated.');
        this.loadPartners();
      },
      error: (err) => {
        partner.isProcessing = false;
        this.toastService.showError(err.error?.message || 'Failed to reactivate partner.');
      }
    });
  }

  getDocumentUrl(docId: number): string {
    return this.documentService.downloadDocumentUrl(docId);
  }
}
