import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Interactive Chart Tooltips
  hoveredBarIndex: number | null = null;
  hoveredLineIndex: number | null = null;

  weeklyRevenueData = [
    { day: 'Mon', revenue: '₹44,000', value: 44000, x: 50, y: 180 },
    { day: 'Tue', revenue: '₹53,000', value: 53000, x: 150, y: 150 },
    { day: 'Wed', revenue: '₹46,000', value: 46000, x: 250, y: 172 },
    { day: 'Thu', revenue: '₹61,000', value: 61000, x: 350, y: 125 },
    { day: 'Fri', revenue: '₹55,000', value: 55000, x: 450, y: 144 },
    { day: 'Sat', revenue: '₹71,000', value: 71000, x: 550, y: 92 },
    { day: 'Sun', revenue: '₹66,000', value: 66000, x: 650, y: 108 }
  ];

  bookingsByVehicleType = [
    { type: 'JCB', count: 45, height: 135, color: '#8b5cf6' },
    { type: 'Excavator', count: 38, height: 114, color: '#8b5cf6' },
    { type: 'Crane', count: 29, height: 87, color: '#8b5cf6' },
    { type: 'Tipper', count: 52, height: 156, color: '#8b5cf6' },
    { type: 'Loader', count: 31, height: 93, color: '#8b5cf6' }
  ];

  ngOnInit() {
    if (typeof window !== 'undefined' && !this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
  }
}
