import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PolicyTermService, PolicyTerm } from '../../../shared/services/policy-term.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-policy-terms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './policy-terms.component.html',
  styleUrls: ['./policy-terms.component.scss']
})
export class PolicyTermsComponent implements OnInit {
  policies: PolicyTerm[] = [];
  filteredPolicies: PolicyTerm[] = [];
  isLoading = false;
  isSaving = false;

  // Filters
  filterApp: string = 'ALL';
  filterType: string = 'ALL';

  // Modal State
  showModal = false;
  isEditing = false;
  currentPolicy: PolicyTerm = {
    targetApp: 'CUSTOMER',
    policyType: 'TERMS',
    title: '',
    content: '',
    version: '1.0',
    active: true
  };

  policyTypes = [
    { value: 'TERMS', label: 'Terms & Conditions' },
    { value: 'PRIVACY', label: 'Privacy Policy' },
    { value: 'REFUND', label: 'Refund Policy' },
    { value: 'CANCELLATION', label: 'Cancellation Policy' },
    { value: 'RENTAL_RULES', label: 'Rental Package Rules' },
    { value: 'OUTSTATION_TERMS', label: 'Outstation Terms & Conditions' },
    { value: 'COMMISSION_POLICY', label: 'Commission & Payout Policy' }
  ];

  constructor(
    private policyService: PolicyTermService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.isLoading = true;
    this.policyService.getAllPolicies().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.policies = res.data;
          this.applyFilters();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.showError(err.error?.message || 'Failed to load policy & terms');
      }
    });
  }

  applyFilters(): void {
    this.filteredPolicies = this.policies.filter(p => {
      const matchApp = this.filterApp === 'ALL' || p.targetApp === this.filterApp || p.targetApp === 'BOTH';
      const matchType = this.filterType === 'ALL' || p.policyType === this.filterType;
      return matchApp && matchType;
    });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.currentPolicy = {
      targetApp: 'CUSTOMER',
      policyType: 'TERMS',
      title: '',
      content: '',
      version: '1.0',
      active: true
    };
    this.showModal = true;
  }

  openEditModal(p: PolicyTerm): void {
    this.isEditing = true;
    this.currentPolicy = { ...p };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  savePolicy(): void {
    if (!this.currentPolicy.title.trim()) {
      this.toastService.showError('Title is required');
      return;
    }
    if (!this.currentPolicy.content.trim()) {
      this.toastService.showError('Content is required');
      return;
    }

    this.isSaving = true;
    if (this.isEditing && this.currentPolicy.id) {
      this.policyService.updatePolicy(this.currentPolicy.id, this.currentPolicy).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.toastService.showSuccess('Policy updated successfully');
          this.closeModal();
          this.loadPolicies();
        },
        error: (err) => {
          this.isSaving = false;
          this.toastService.showError(err.error?.message || 'Failed to update policy');
        }
      });
    } else {
      this.policyService.createPolicy(this.currentPolicy).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.toastService.showSuccess('Policy created successfully');
          this.closeModal();
          this.loadPolicies();
        },
        error: (err) => {
          this.isSaving = false;
          this.toastService.showError(err.error?.message || 'Failed to create policy');
        }
      });
    }
  }

  toggleActive(p: PolicyTerm): void {
    if (!p.id) return;
    const newStatus = !p.active;
    this.policyService.updatePolicy(p.id, { active: newStatus }).subscribe({
      next: () => {
        p.active = newStatus;
        this.toastService.showSuccess(`Policy ${newStatus ? 'activated' : 'deactivated'}`);
      },
      error: () => {
        this.toastService.showError('Failed to change policy status');
      }
    });
  }

  deletePolicy(p: PolicyTerm): void {
    if (!p.id || !confirm(`Are you sure you want to delete policy: ${p.title}?`)) return;

    this.policyService.deletePolicy(p.id).subscribe({
      next: () => {
        this.toastService.showSuccess('Policy deleted successfully');
        this.loadPolicies();
      },
      error: () => {
        this.toastService.showError('Failed to delete policy');
      }
    });
  }
}
