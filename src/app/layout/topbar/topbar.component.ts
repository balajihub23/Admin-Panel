import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';

export interface TopbarNotification {
  id?: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  deepLink?: string;
  notificationType?: string;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  @Output() toggleSidebar = new EventEmitter<void>();

  // Dropdown States
  showProfileDropdown: boolean = false;
  showNotificationDropdown: boolean = false;

  // Active User Profile Info
  userFullName: string = 'Admin';
  userRole: string = 'ADMIN';
  userEmail: string = 'admin@rentron.com';

  notifications: TopbarNotification[] = [
    {
      id: 1,
      title: 'New Vehicle Registration',
      desc: 'TN 09 BK 8842 submitted for review (JCB 3DX EcoXcellence)',
      time: 'Just now',
      unread: true,
      deepLink: '/vehicles',
      notificationType: 'VEHICLE'
    },
    {
      id: 2,
      title: 'Driver Approval Pending',
      desc: 'Robert G. uploaded verification documents',
      time: '1 hr ago',
      unread: true,
      deepLink: '/partners',
      notificationType: 'PARTNER'
    },
    {
      id: 3,
      title: 'New Booking Request',
      desc: 'JCB 3DX requested by John Doe',
      time: '2 hrs ago',
      unread: true,
      deepLink: '/bookings',
      notificationType: 'BOOKING'
    },
    {
      id: 4,
      title: 'Payment Confirmed',
      desc: '₹45,000 received for Booking #4301',
      time: '3 hrs ago',
      unread: false,
      deepLink: '/payments',
      notificationType: 'PAYMENT'
    }
  ];

  ngOnInit() {
    this.userFullName = this.authService.getUserFullName() || 'System Administrator';
    this.userRole = this.authService.getUserRole() || 'ADMIN';
    this.userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') || 'admin@rentron.com' : 'admin@rentron.com';

    this.loadRealNotifications();
  }

  loadRealNotifications(): void {
    this.notificationService.getMyNotifications().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const apiNotifications: TopbarNotification[] = res.data.map((item: any) => ({
            id: item.id,
            title: item.title || 'Notification',
            desc: item.message || '',
            time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
            unread: !item.isRead,
            deepLink: item.deepLink || this.resolveDeepLink(item.title, item.notificationType),
            notificationType: item.notificationType || 'SYSTEM'
          }));
          this.notifications = apiNotifications;
        }
      },
      error: (err) => console.warn('Notification fetch warning:', err)
    });
  }

  get unreadCount(): number {
    return this.notifications.filter(n => n.unread).length;
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
      this.loadRealNotifications();
    }
  }

  onNotificationClick(notif: TopbarNotification): void {
    notif.unread = false;

    if (notif.id) {
      this.notificationService.markAsRead(notif.id).subscribe();
    }

    this.showNotificationDropdown = false;

    // Determine target route and navigate
    const targetPath = notif.deepLink || this.resolveDeepLink(notif.title, notif.notificationType);
    if (targetPath) {
      this.router.navigateByUrl(targetPath);
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.unread = false);
    this.notificationService.markAllAsRead().subscribe();
  }

  private resolveDeepLink(title?: string, type?: string): string {
    const text = (title || '' + ' ' + (type || '')).toLowerCase();
    if (text.includes('vehicle') || text.includes('vahan') || text.includes('machinery') || text.includes('chassis') || text.includes('vin')) {
      return '/vehicles';
    }
    if (text.includes('driver') || text.includes('partner') || text.includes('contractor') || text.includes('approval')) {
      return '/partners';
    }
    if (text.includes('booking') || text.includes('order')) {
      return '/bookings';
    }
    if (text.includes('payment') || text.includes('payout')) {
      return '/payments';
    }
    return '/dashboard';
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
