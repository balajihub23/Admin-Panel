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
  cancelledJobs = 0;

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
          const driver = res.data;
          this.driver = driver;
          this.completedJobs = driver.totalJobs || 0;
          this.loadDocuments();

          // Populate a default onboarding entry in the job history table once approved
          if (driver.status === 'ACTIVE' || driver.status === 'ACTIVE_ONLINE' || driver.status === 'BUSY' || driver.status === 'OFFLINE') {
            const approvalDate = driver.createdAt ? driver.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
            this.jobs = [
              {
                id: 'SYS-VERIFY',
                date: approvalDate,
                customer: 'System Onboarding & Verification',
                duration: 'Verified',
                earnings: 0,
                status: 'Completed'
              }
            ];
          } else {
            this.jobs = [];
          }
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
