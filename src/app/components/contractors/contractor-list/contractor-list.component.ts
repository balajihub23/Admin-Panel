import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContractorService, Contractor } from '../../../shared/services/contractor.service';
import { DocumentService, DocumentInfo } from '../../../shared/services/document.service';
import { FileUploaderComponent } from '../../../shared/components/file-uploader/file-uploader.component';
import { forkJoin } from 'rxjs';

import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-contractor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FileUploaderComponent],
  templateUrl: './contractor-list.component.html',
  styleUrl: './contractor-list.component.scss'
})
export class ContractorListComponent implements OnInit {
  private contractorService = inject(ContractorService);
  private documentService = inject(DocumentService);
  private toastService = inject(ToastService);

  contractors: Contractor[] = [];
  isLoading = true;
  isRefreshing = false;

  // Pagination fields
  currentPage = 1;
  pageSize = 5;

  // Verification documents map: contractorId -> DocumentInfo[]
  documentsMap: { [key: number]: DocumentInfo[] } = {};

  // File variables
  selectedCompanyRegFile: File | null = null;
  selectedGstFile: File | null = null;
  selectedOwnerPhotoFile: File | null = null;

  // Stats
  totalContractors = 0;
  activeContractors = 0;
  pendingVerification = 0;
  suspendedContractors = 0;

  // View state: 'list' or 'queue'
  currentView: 'list' | 'queue' = 'list';

  // Filters
  searchQuery = '';
  selectedStatusFilter = 'All';

  // Add Contractor Modal state
  isModalOpen = false;
  isSaving = false;
  formError = '';
  modalTitle = 'Add New Contractor';
  editingContractor: Contractor | null = null;

  // Form Fields
  formName = '';
  formPhone = '';
  formEmail = '';
  formCompanyName = '';
  formGstNumber = '';
  formExperience = '';

  ngOnInit(): void {
    this.loadContractors();
  }

  loadContractors(): void {
    this.isLoading = true;
    this.contractorService.getContractors().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.contractors = res.data;
          this.calculateStats();
          this.loadDocumentsForPendingContractors();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading contractors:', err);
      }
    });
  }

  loadDocumentsForPendingContractors(): void {
    this.contractors.forEach(con => {
      if (con.id) {
        this.documentService.getDocumentsForEntity('CONTRACTOR', con.id).subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.documentsMap[con.id!] = res.data;
            }
          },
          error: (err) => console.error('Error loading docs for contractor: ' + con.id, err)
        });
      }
    });
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.contractorService.getContractors().subscribe({
      next: (res) => {
        this.isRefreshing = false;
        if (res.success && res.data) {
          this.contractors = res.data;
          this.calculateStats();
          this.loadDocumentsForPendingContractors();
        }
      },
      error: (err) => {
        this.isRefreshing = false;
        console.error('Error refreshing contractors:', err);
      }
    });
  }

  calculateStats(): void {
    this.totalContractors = this.contractors.length;
    this.activeContractors = this.contractors.filter(c => c.status === 'ACTIVE').length;
    this.pendingVerification = this.contractors.filter(c => c.status === 'PENDING_VERIFICATION').length;
    this.suspendedContractors = this.contractors.filter(c => c.status === 'SUSPENDED').length;
  }

  toggleView(view: 'list' | 'queue'): void {
    this.currentView = view;
    this.currentPage = 1;
  }

  get paginatedContractors(): Contractor[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredContractors.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredContractors.length / this.pageSize) || 1;
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

  get filteredContractors(): Contractor[] {
    let list = this.contractors;

    if (this.currentView === 'list') {
      list = this.contractors;
    } else {
      list = this.contractors.filter(c => c.status === 'PENDING_VERIFICATION' || c.status === 'REJECTED');
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(c =>
        c.fullName.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.phone.includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q))
      );
    }

    if (this.selectedStatusFilter !== 'All') {
      list = list.filter(c => c.status === this.selectedStatusFilter);
    }

    return list;
  }

  // ── Application Actions ──────────────────────────────────────────────────────
  approveContractor(id: number, event: Event): void {
    event.stopPropagation();
    this.contractorService.approveContractor(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess('✓ Contractor approved successfully!');
          this.loadContractors();
        } else {
          this.toastService.showError('Failed to approve contractor: ' + res.message);
        }
      },
      error: (err) => {
        console.error('Error approving contractor:', err);
        this.toastService.showError(err.error?.message || 'Error occurred during approval');
      }
    });
  }

  rejectContractor(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to reject this contractor application?')) {
      this.contractorService.rejectContractor(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.showSuccess('✓ Contractor application rejected.');
            this.loadContractors();
          } else {
            this.toastService.showError('Failed to reject: ' + res.message);
          }
        },
        error: (err) => {
          console.error(err);
          this.toastService.showError('Error occurred during rejection');
        }
      });
    }
  }

  // Preloaded documents state for Edit modal
  editCompanyRegDoc: DocumentInfo | null = null;
  editGstDoc: DocumentInfo | null = null;
  editOwnerPhotoDoc: DocumentInfo | null = null;


  // ── Modal CRUD Form ─────────────────────────────────────────────────────────
  openAddModal(): void {
    this.modalTitle = 'Add New Contractor';
    this.editingContractor = null;
    this.resetForm();
    this.isModalOpen = true;
  }

  openEditModal(contractor: Contractor, event: Event): void {
    event.stopPropagation();
    this.modalTitle = 'Edit Contractor Details';
    this.editingContractor = contractor;
    this.formName = contractor.fullName;
    this.formPhone = contractor.phone;
    this.formEmail = contractor.email || '';
    this.formCompanyName = contractor.companyName || '';
    this.formGstNumber = contractor.gstNumber || '';
    this.formExperience = contractor.experience || '';
    this.formError = '';
    this.editCompanyRegDoc = null;
    this.editGstDoc = null;
    this.editOwnerPhotoDoc = null;
    this.uploadedDocIds = [];
    this.isModalOpen = true;

    // Directly fetch documents from server to ensure they are loaded
    if (contractor.id) {
      this.documentService.getDocumentsForEntity('CONTRACTOR', contractor.id).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const docList: DocumentInfo[] = res.data;
            this.documentsMap[contractor.id!] = docList;
            this.editCompanyRegDoc = docList.find(d => d.documentType === 'COMPANY_REGISTRATION') || null;
            this.editGstDoc = docList.find(d => d.documentType === 'GST_CERTIFICATE') || null;
            this.editOwnerPhotoDoc = docList.find(d => d.documentType === 'PHOTO') || null;
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
    if (this.editCompanyRegDoc && this.editCompanyRegDoc.id === docId) {
      this.editCompanyRegDoc = null;
    }
    if (this.editGstDoc && this.editGstDoc.id === docId) {
      this.editGstDoc = null;
    }
    if (this.editOwnerPhotoDoc && this.editOwnerPhotoDoc.id === docId) {
      this.editOwnerPhotoDoc = null;
    }
  }

  resetForm(): void {
    this.formName = '';
    this.formPhone = '';
    this.formEmail = '';
    this.formCompanyName = '';
    this.formGstNumber = '';
    this.formExperience = '';
    this.uploadedDocIds = [];
    this.editCompanyRegDoc = null;
    this.editGstDoc = null;
    this.editOwnerPhotoDoc = null;
    this.formError = '';
  }

  onSubmit(): void {
    if (!this.formName.trim() || !this.formPhone.trim()) {
      this.formError = 'Contractor Name and Phone Number are required.';
      return;
    }

    this.isSaving = true;
    this.formError = '';

    const payload: Contractor = {
      id: this.editingContractor ? this.editingContractor.id : undefined,
      fullName: this.formName.trim(),
      phone: this.formPhone.trim(),
      email: this.formEmail.trim() || undefined,
      companyName: this.formCompanyName.trim() || undefined,
      gstNumber: this.formGstNumber.trim() || undefined,
      experience: this.formExperience.trim() || undefined,
      status: this.editingContractor ? this.editingContractor.status : 'PENDING_VERIFICATION'
    };

    this.contractorService.saveContractor(payload).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const savedContractorId = res.data.id;
          
          if (this.uploadedDocIds.length > 0) {
            this.documentService.associateDocuments(this.uploadedDocIds, 'CONTRACTOR', savedContractorId).subscribe({
              next: () => {
                this.isSaving = false;
                this.toastService.showSuccess('✓ Contractor and documents saved successfully!');
                this.loadContractors();
                this.closeModal();
              },
              error: (assocErr) => {
                this.isSaving = false;
                this.toastService.showError('Contractor saved, but document association failed: ' + (assocErr.error?.message || assocErr.message));
                this.loadContractors();
              }
            });
          } else {
            this.isSaving = false;
            this.toastService.showSuccess('✓ Contractor saved successfully!');
            this.loadContractors();
            this.closeModal();
          }
        } else {
          this.isSaving = false;
          this.formError = res.message || 'Failed to save contractor';
          this.toastService.showError(this.formError);
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.formError = err.error?.message || 'Error occurred while saving contractor';
        this.toastService.showError(this.formError);
      }
    });
  }

  deleteContractor(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this contractor record?')) {
      this.contractorService.deleteContractor(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.showSuccess('✓ Contractor deleted successfully.');
            this.loadContractors();
          } else {
            this.toastService.showError('Failed to delete: ' + res.message);
          }
        },
        error: (err) => {
          console.error(err);
          this.toastService.showError('Error occurred while deleting contractor');
        }
      });
    }
  }

  getDocForContractor(contractorId: number, docType: string): DocumentInfo | undefined {
    const list = this.documentsMap[contractorId];
    return list ? list.find(d => d.documentType === docType) : undefined;
  }

  getDownloadUrl(doc: DocumentInfo | null | undefined): string {
    return doc ? this.documentService.downloadDocumentUrl(doc.id) : '';
  }
}
