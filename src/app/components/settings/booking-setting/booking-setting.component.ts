import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingSettingService, BookingSetting } from '../../../shared/services/booking-setting.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-booking-setting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-setting.component.html',
  styleUrls: ['./booking-setting.component.scss']
})
export class BookingSettingComponent implements OnInit {
  settings: BookingSetting = {
    gateway: 'RAZORPAY',
    paymentEnabled: true,
    currency: 'INR',
    environment: 'TEST',
    assignmentType: 'AUTO',
    initialRadiusKm: 5.0,
    radiusIncrementKm: 5.0,
    maxRadiusKm: 20.0,
    assignmentTimeoutSeconds: 30,
    maxLocationAgeSeconds: 300,
    notifyAdminWhenUnassigned: true
  };

  isLoading = false;
  isSaving = false;

  constructor(
    private bookingSettingService: BookingSettingService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.bookingSettingService.getSettings().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.settings = res.data;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.showError(err.error?.message || 'Failed to load booking settings');
      }
    });
  }

  saveSettings(): void {
    this.isSaving = true;
    this.bookingSettingService.updateSettings(this.settings).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.toastService.showSuccess('Payment & Auto-Assignment Settings saved successfully');
          this.loadSettings();
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.toastService.showError(err.error?.message || 'Failed to save settings');
      }
    });
  }
}
