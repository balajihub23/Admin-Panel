import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { MenuService } from '../../shared/services/menu.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private menuService = inject(MenuService);
  private router = inject(Router);

  // Form Fields
  email: string = '';
  password: string = '';
  
  // Visual Toggles
  showPassword = false;
  loading = false;
  errorMessage = '';

  ngOnInit() {
    if (typeof window !== 'undefined' && this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email address and password';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const loginPayload = {
      loginType: 'EMAIL_PASSWORD',
      email: this.email,
      password: this.password
    };

    this.authService.login(loginPayload).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          // Immediately fetch the authorized menu scopes dynamically from the backend
          this.menuService.getAccessibleMenus().subscribe({
            next: () => {
              this.loading = false;
              this.router.navigate(['/dashboard']);
            },
            error: (menuErr) => {
              console.error('Menu load error:', menuErr);
              this.loading = false;
              this.router.navigate(['/dashboard']);
            }
          });
        } else {
          this.loading = false;
          this.errorMessage = res.message || 'Authentication failed';
        }
      },
      error: (err: any) => {
        this.loading = false;
        
        if (err.status === 0) {
          this.errorMessage = 'Could not connect to the authentication server. Please check if the backend is running.';
        } else {
          this.errorMessage = err.error?.message || 'Invalid email or password';
        }
      }
    });
  }
}
