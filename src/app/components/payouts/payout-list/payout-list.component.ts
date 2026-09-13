import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayoutService, DriverWithdrawal } from '../../../shared/services/payout.service';

@Component({
  selector: 'app-payout-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payout-list.component.html',
  styleUrl: './payout-list.component.scss'
})
export class PayoutListComponent implements OnInit {
  private payoutService = inject(PayoutService);

  payouts: DriverWithdrawal[] = [];
  filteredPayouts: DriverWithdrawal[] = [];
  isLoading: boolean = false;
  isRefreshing: boolean = false;

  // Search & Filter
  searchQuery: string = '';
  selectedStatusFilter: string = 'All';

  // Stats Counters
  totalCount: number = 0;
  totalAmount: number = 0;
  pendingCount: number = 0;
  pendingAmount: number = 0;
  processedCount: number = 0;
  processedAmount: number = 0;
  rejectedCount: number = 0;

  // Action Modal State
  selectedPayout: DriverWithdrawal | null = null;
  showProcessModal: boolean = false;
  showRejectModal: boolean = false;
  adminRemarks: string = '';
  isSubmittingAction: boolean = false;

  ngOnInit(): void {
    this.loadPayouts();
  }

  loadPayouts(): void {
    this.isLoading = true;
    this.payoutService.getPayouts().subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isRefreshing = false;
        if (res && res.data) {
          this.payouts = res.data;
        } else {
          this.payouts = [];
        }
        this.applyFilters();
      },
      error: () => {
        this.isLoading = false;
        this.isRefreshing = false;
        this.payouts = [];
        this.applyFilters();
      }
    });
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.loadPayouts();
  }

  applyFilters(): void {
    let list = [...this.payouts];

    if (this.selectedStatusFilter !== 'All') {
      list = list.filter(p => (p.status || '').toUpperCase() === this.selectedStatusFilter.toUpperCase());
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.referenceNumber || '').toLowerCase().includes(q) ||
        (p.driverName || '').toLowerCase().includes(q) ||
        (p.driverPhone || '').toLowerCase().includes(q) ||
        (p.bankAccountDetails || '').toLowerCase().includes(q)
      );
    }

    this.filteredPayouts = list;
    this.calculateStats();
  }

  calculateStats(): void {
    this.totalCount = this.payouts.length;
    this.totalAmount = this.payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

    const pending = this.payouts.filter(p => p.status === 'PENDING');
    this.pendingCount = pending.length;
    this.pendingAmount = pending.reduce((sum, p) => sum + (p.amount || 0), 0);

    const processed = this.payouts.filter(p => p.status === 'PROCESSED' || p.status === 'APPROVED');
    this.processedCount = processed.length;
    this.processedAmount = processed.reduce((sum, p) => sum + (p.amount || 0), 0);

    this.rejectedCount = this.payouts.filter(p => p.status === 'REJECTED').length;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatusFilter = 'All';
    this.applyFilters();
  }

  openProcessModal(payout: DriverWithdrawal): void {
    this.selectedPayout = payout;
    this.adminRemarks = '';
    this.showProcessModal = true;
  }

  openRejectModal(payout: DriverWithdrawal): void {
    this.selectedPayout = payout;
    this.adminRemarks = '';
    this.showRejectModal = true;
  }

  confirmProcessPayout(): void {
    if (!this.selectedPayout || this.isSubmittingAction) return;

    this.isSubmittingAction = true;
    this.payoutService.processPayout(this.selectedPayout.id, this.adminRemarks).subscribe({
      next: (res) => {
        this.isSubmittingAction = false;
        this.showProcessModal = false;
        this.selectedPayout = null;
        this.loadPayouts();
      },
      error: () => {
        this.isSubmittingAction = false;
      }
    });
  }

  confirmRejectPayout(): void {
    if (!this.selectedPayout || this.isSubmittingAction) return;

    this.isSubmittingAction = true;
    this.payoutService.rejectPayout(this.selectedPayout.id, this.adminRemarks).subscribe({
      next: (res) => {
        this.isSubmittingAction = false;
        this.showRejectModal = false;
        this.selectedPayout = null;
        this.loadPayouts();
      },
      error: () => {
        this.isSubmittingAction = false;
      }
    });
  }
}
