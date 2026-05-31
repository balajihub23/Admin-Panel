import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  @Output() toggleSidebar = new EventEmitter<void>();

  // Dropdown States
  showProfileDropdown: boolean = false;
  showNotificationDropdown: boolean = false;

  // Active User Profile Info
  userFullName: string = 'Admin';
  userRole: string = 'ADMIN';
  userEmail: string = 'admin@rentron.com';

  notifications = [
    { id: 1, title: 'New Booking Request', desc: 'JCB 3DX requested by John Doe', time: '2 mins ago', unread: true },
    { id: 2, title: 'Driver Approval Pending', desc: 'Robert G. uploaded verification documents', time: '1 hr ago', unread: true },
    { id: 3, title: 'Payment Confirmed', desc: '₹45,000 received for Booking #4301', time: '3 hrs ago', unread: false }
  ];

  ngOnInit() {
    this.userFullName = this.authService.getUserFullName() || 'System Administrator';
    this.userRole = this.authService.getUserRole() || 'ADMIN';
    this.userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') || 'admin@rentron.com' : 'admin@rentron.com';
  }

  toggle() {
    this.toggleSidebar.emit();
  }

  toggleProfileDropdown() {
    this.showProfileDropdown = !this.showProfileDropdown;
    if (this.showProfileDropdown) {
      this.showNotificationDropdown = false;
    }
  }

  toggleNotificationDropdown() {
    this.showNotificationDropdown = !this.showNotificationDropdown;
    if (this.showNotificationDropdown) {
      this.showProfileDropdown = false;
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
