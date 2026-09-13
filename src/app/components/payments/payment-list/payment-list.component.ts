import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PaymentService } from '../../../shared/services/payment.service';
import { PayoutService, DriverWithdrawal } from '../../../shared/services/payout.service';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './payment-list.component.html',
  styleUrl: './payment-list.component.scss'
})
export class PaymentListComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private payoutService = inject(PayoutService);

  activeTab: 'CLIENT_PAYMENTS' | 'DRIVER_PAYOUTS' = 'CLIENT_PAYMENTS';

  // Client Transactions State
  transactions: any[] = [];
  filteredTransactions: any[] = [];
  isLoadingTransactions: boolean = false;
  isRefreshing: boolean = false;
  searchQuery: string = '';
  selectedStatusFilter: string = 'All';

  grossRevenue: number = 0;
  pendingSettlement: number = 0;
  completedSettlement: number = 0;
  totalTransactions: number = 0;

  // Driver Payouts State
  payouts: DriverWithdrawal[] = [];
  filteredPayouts: DriverWithdrawal[] = [];
  isLoadingPayouts: boolean = false;
  payoutSearchQuery: string = '';
  selectedPayoutStatusFilter: string = 'All';

  totalPayoutsAmount: number = 0;
  completedPayoutsAmount: number = 0;
  pendingPayoutsAmount: number = 0;

  selectedPayout: DriverWithdrawal | null = null;
  showProcessModal: boolean = false;
  adminRemarks: string = '';
  isSubmittingPayout: boolean = false;

  private pendingRequestsCount: number = 0;

  ngOnInit(): void {
    this.loadTransactions();
    this.loadPayouts();
  }

  loadTransactions(): void {
    this.isLoadingTransactions = true;
    this.paymentService.getAdminTransactions().subscribe({
      next: (res) => {
        this.isLoadingTransactions = false;
        if (res && res.data) {
          this.grossRevenue = res.data.grossRevenue || 0;
          this.pendingSettlement = res.data.pendingSettlement || 0;
          this.totalTransactions = res.data.totalTransactions || 0;
          this.transactions = res.data.transactions || [];

          this.completedSettlement = this.transactions
            .filter(t => (t.paymentStatus || '').toUpperCase() === 'PAID' || (t.paymentStatus || '').toUpperCase() === 'SETTLED' || (t.paymentStatus || '').toUpperCase() === 'COMPLETED')
            .reduce((sum, t) => sum + (t.amountCharged || 0), 0);
        } else {
          this.transactions = [];
          this.completedSettlement = 0;
        }
        this.applyFilters();
        this.checkRefreshDone();
      },
      error: () => {
        this.isLoadingTransactions = false;
        this.transactions = [];
        this.completedSettlement = 0;
        this.applyFilters();
        this.checkRefreshDone();
      }
    });
  }

  loadPayouts(): void {
    this.isLoadingPayouts = true;
    this.payoutService.getPayouts().subscribe({
      next: (res) => {
        this.isLoadingPayouts = false;
        if (res && res.data) {
          this.payouts = res.data;
          this.totalPayoutsAmount = this.payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
          this.completedPayoutsAmount = this.payouts
            .filter(p => (p.status || '').toUpperCase() === 'PROCESSED' || (p.status || '').toUpperCase() === 'APPROVED' || (p.status || '').toUpperCase() === 'COMPLETED')
            .reduce((sum, p) => sum + (p.amount || 0), 0);
          this.pendingPayoutsAmount = this.payouts
            .filter(p => (p.status || '').toUpperCase() === 'PENDING')
            .reduce((sum, p) => sum + (p.amount || 0), 0);
        } else {
          this.payouts = [];
          this.totalPayoutsAmount = 0;
          this.completedPayoutsAmount = 0;
          this.pendingPayoutsAmount = 0;
        }
        this.applyPayoutFilters();
        this.checkRefreshDone();
      },
      error: () => {
        this.isLoadingPayouts = false;
        this.payouts = [];
        this.totalPayoutsAmount = 0;
        this.completedPayoutsAmount = 0;
        this.pendingPayoutsAmount = 0;
        this.applyPayoutFilters();
        this.checkRefreshDone();
      }
    });
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.pendingRequestsCount = 2;
    this.loadTransactions();
    this.loadPayouts();
  }

  private checkRefreshDone(): void {
    if (this.pendingRequestsCount > 0) {
      this.pendingRequestsCount--;
      if (this.pendingRequestsCount === 0) {
        this.isRefreshing = false;
      }
    }
  }

  applyFilters(): void {
    let list = [...this.transactions];

    if (this.selectedStatusFilter !== 'All') {
      const f = this.selectedStatusFilter.toUpperCase();
      if (f === 'COMPLETED') {
        list = list.filter(t => (t.paymentStatus || '').toUpperCase() === 'PAID' || (t.paymentStatus || '').toUpperCase() === 'SETTLED' || (t.paymentStatus || '').toUpperCase() === 'COMPLETED');
      } else if (f === 'IN_PROGRESS' || f === 'PROCESSING') {
        list = list.filter(t => (t.paymentStatus || '').toUpperCase() === 'PROCESSING' || (t.paymentStatus || '').toUpperCase() === 'PENDING');
      } else {
        list = list.filter(t => (t.paymentStatus || '').toUpperCase() === f);
      }
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(t =>
        (t.transactionId || '').toLowerCase().includes(q) ||
        (t.bookingNumber || '').toLowerCase().includes(q) ||
        (t.billingAccount || '').toLowerCase().includes(q) ||
        (t.gatewayRef || '').toLowerCase().includes(q)
      );
    }

    this.filteredTransactions = list;
  }

  applyPayoutFilters(): void {
    let list = [...this.payouts];

    if (this.selectedPayoutStatusFilter !== 'All') {
      const f = this.selectedPayoutStatusFilter.toUpperCase();
      if (f === 'COMPLETED') {
        list = list.filter(p => (p.status || '').toUpperCase() === 'PROCESSED' || (p.status || '').toUpperCase() === 'APPROVED' || (p.status || '').toUpperCase() === 'COMPLETED');
      } else if (f === 'IN_PROGRESS' || f === 'PENDING') {
        list = list.filter(p => (p.status || '').toUpperCase() === 'PENDING');
      } else {
        list = list.filter(p => (p.status || '').toUpperCase() === f);
      }
    }

    if (this.payoutSearchQuery.trim()) {
      const q = this.payoutSearchQuery.toLowerCase();
      list = list.filter(p =>
        (p.referenceNumber || '').toLowerCase().includes(q) ||
        (p.driverName || '').toLowerCase().includes(q) ||
        (p.driverPhone || '').toLowerCase().includes(q) ||
        (p.bankAccountDetails || '').toLowerCase().includes(q)
      );
    }

    this.filteredPayouts = list;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatusFilter = 'All';
    this.applyFilters();
  }

  resetPayoutFilters(): void {
    this.payoutSearchQuery = '';
    this.selectedPayoutStatusFilter = 'All';
    this.applyPayoutFilters();
  }

  exportCsv(): void {
    let csvData: string = '';
    let filename: string = '';

    if (this.activeTab === 'CLIENT_PAYMENTS') {
      filename = `client_payment_transactions_${new Date().toISOString().split('T')[0]}.csv`;
      const headers = ['Transaction ID', 'Booking Number', 'Billing Account', 'Customer Phone', 'Amount Charged (INR)', 'Gateway Ref', 'Payment Status', 'Booking Status', 'Date'];
      const rows = this.filteredTransactions.map(t => [
        `"${t.transactionId || ''}"`,
        `"${t.bookingNumber || ''}"`,
        `"${t.billingAccount || ''}"`,
        `"${t.customerPhone || ''}"`,
        t.amountCharged || 0,
        `"${t.gatewayRef || ''}"`,
        `"${t.paymentStatus || ''}"`,
        `"${t.bookingStatus || ''}"`,
        `"${t.createdAt || ''}"`
      ]);
      csvData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else {
      filename = `driver_payout_requests_${new Date().toISOString().split('T')[0]}.csv`;
      const headers = ['Reference Number', 'Driver Name', 'Driver Phone', 'Withdrawal Amount (INR)', 'Payout Destination', 'Status', 'Requested Date'];
      const rows = this.filteredPayouts.map(p => [
        `"${p.referenceNumber || ''}"`,
        `"${p.driverName || ''}"`,
        `"${p.driverPhone || ''}"`,
        p.amount || 0,
        `"${p.bankAccountDetails || ''}"`,
        `"${p.status || ''}"`,
        `"${p.requestedAt || ''}"`
      ]);
      csvData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onChangePaymentStatus(tx: any, newStatus: string): void {
    this.paymentService.updatePaymentStatus(tx.bookingId, newStatus).subscribe({
      next: (res) => {
        if (res && res.success) {
          tx.paymentStatus = newStatus;
          this.loadTransactions();
        }
      }
    });
  }

  openProcessModal(payout: DriverWithdrawal): void {
    this.selectedPayout = payout;
    this.adminRemarks = '';
    this.showProcessModal = true;
  }

  confirmProcessPayout(): void {
    if (!this.selectedPayout || this.isSubmittingPayout) return;
    this.isSubmittingPayout = true;

    this.payoutService.processPayout(this.selectedPayout.id, this.adminRemarks).subscribe({
      next: (res) => {
        this.isSubmittingPayout = false;
        this.showProcessModal = false;
        this.selectedPayout = null;
        this.loadPayouts();
        this.loadTransactions();
      },
      error: () => {
        this.isSubmittingPayout = false;
      }
    });
  }
}
