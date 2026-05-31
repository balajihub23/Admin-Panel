import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Flow State
  step: 1 | 2 | 3 = 1; // 1 = Request OTP, 2 = Verify OTP & Reset Password, 3 = Success Redirect
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Form Fields
  phone: string = '';
  otpCode: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  // Password Toggles
  showPassword = false;
  showConfirmPassword = false;
  
  // Success Redirect Countdown
  redirectCountdown = 3;
  private countdownInterval: any;

  // Formatting helpers
  validatePhone(phone: string): boolean {
    return /^\+?[0-9]{10,15}$/.test(phone);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onRequestOtp(): void {
    if (!this.phone) {
      this.errorMessage = 'Please enter your registered phone number';
      return;
    }

    if (!this.validatePhone(this.phone)) {
      this.errorMessage = 'Please enter a valid phone number (e.g. +919876543210)';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      phone: this.phone,
      purpose: 'RESET_PASSWORD'
    };

    this.authService.sendOtp(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.step = 2;
        } else {
          this.errorMessage = res.message || 'Failed to request verification code';
        }
      },
      error: (err: any) => {
        this.loading = false;
        if (err.status === 0) {
          this.errorMessage = 'Could not connect to the server. Please check if the backend is running.';
        } else {
          this.errorMessage = err.error?.message || 'No registered account found with this phone number';
        }
      }
    });
  }

  onResetPassword(): void {
    if (!this.otpCode) {
      this.errorMessage = 'Please enter the 6-digit verification code';
      return;
    }

    if (this.otpCode.length !== 6) {
      this.errorMessage = 'Verification code must be exactly 6 digits';
      return;
    }

    if (!this.newPassword) {
      this.errorMessage = 'Please enter a new password';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      phone: this.phone,
      otpCode: this.otpCode,
      newPassword: this.newPassword
    };

    this.authService.resetPassword(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.step = 3;
          this.startRedirectCountdown();
        } else {
          this.errorMessage = res.message || 'Failed to reset password';
        }
      },
      error: (err: any) => {
        this.loading = false;
        if (err.status === 0) {
          this.errorMessage = 'Could not connect to the server. Please check if the backend is running.';
        } else {
          this.errorMessage = err.error?.message || 'Invalid verification code or processing failure';
        }
      }
    });
  }

  startRedirectCountdown(): void {
    this.redirectCountdown = 3;
    this.countdownInterval = setInterval(() => {
      this.redirectCountdown--;
      if (this.redirectCountdown <= 0) {
        clearInterval(this.countdownInterval);
        this.router.navigate(['/login']);
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
