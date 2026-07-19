import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DriverService, Driver } from '../../../shared/services/driver.service';
import { DocumentService, DocumentInfo } from '../../../shared/services/document.service';

interface Job {
  id: string;
  date: string;
  customer: string;
  duration: string;
  earnings: number;
  status: string;
}

@Component({
  selector: 'app-driver-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './driver-profile.component.html',
  styleUrl: './driver-profile.component.scss'
})
export class DriverProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private driverService = inject(DriverService);
  private documentService = inject(DocumentService);

  driverId = 0;
  driver: Driver | null = null;
  isLoading = true;
  documents: DocumentInfo[] = [];

  // Stats
  completedJobs = 0;
  cancelledJobs = 8; // static mock value from Screenshot 2

  // Simulated Job History
  jobs: Job[] = [];

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.driverId = parseInt(idParam);
      this.loadDriverDetails();
    } else {
      this.router.navigate(['/drivers']);
    }
  }

  loadDriverDetails(): void {
    this.isLoading = true;
    this.driverService.getDriverById(this.driverId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.driver = res.data;
          this.completedJobs = res.data.totalJobs || 0;
          this.generateMockJobs();
          this.loadDocuments();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading driver profile:', err);
      }
    });
  }

  loadDocuments(): void {
    this.documentService.getDocumentsForEntity('DRIVER', this.driverId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.documents = res.data;
        }
      },
      error: (err) => console.error('Error loading documents:', err)
    });
  }

  generateMockJobs(): void {
    if (!this.driver) return;
    this.jobs = [
      { id: 'BK-101', date: '2025-01-15', customer: 'Rajesh Sharma', duration: '8 hours', earnings: 2500, status: 'Completed' },
      { id: 'BK-098', date: '2025-01-12', customer: 'Vikas Gupta', duration: '6 hours', earnings: 1800, status: 'Completed' },
      { id: 'BK-095', date: '2025-01-10', customer: 'Amit Kumar', duration: '4 hours', earnings: 1200, status: 'Completed' },
      { id: 'BK-090', date: '2025-01-08', customer: 'Karan Singh', duration: '8 hours', earnings: 2500, status: 'Completed' }
    ];
  }

  approveDriver(): void {
    if (!this.driver) return;
    this.driverService.approveDriver(this.driverId).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadDriverDetails();
        } else {
          alert('Error: ' + res.message);
        }
      },
      error: (err) => alert(err.error?.message || 'Error')
    });
  }

  suspendAccount(): void {
    if (!this.driver) return;
    if (confirm('Are you sure you want to suspend this driver account? The user will be unable to log in.')) {
      this.driverService.suspendDriver(this.driverId).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadDriverDetails();
          } else {
            alert('Error suspending account: ' + res.message);
          }
        },
        error: (err) => alert(err.error?.message || 'Error occurred')
      });
    }
  }

  unsuspendAccount(): void {
    if (!this.driver) return;
    this.driverService.unsuspendDriver(this.driverId).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadDriverDetails();
        } else {
          alert('Error unsuspending account: ' + res.message);
        }
      },
      error: (err) => alert(err.error?.message || 'Error occurred')
    });
  }

  getDownloadUrl(doc: DocumentInfo): string {
    return this.documentService.downloadDocumentUrl(doc.id);
  }
}
