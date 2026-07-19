import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContractorService, Contractor } from '../../../shared/services/contractor.service';
import { DocumentService, DocumentInfo } from '../../../shared/services/document.service';

@Component({
  selector: 'app-contractor-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contractor-profile.component.html',
  styleUrl: './contractor-profile.component.scss'
})
export class ContractorProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contractorService = inject(ContractorService);
  private documentService = inject(DocumentService);

  contractorId = 0;
  contractor: Contractor | null = null;
  isLoading = true;
  documents: DocumentInfo[] = [];

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.contractorId = parseInt(idParam);
      this.loadContractorDetails();
    } else {
      this.router.navigate(['/contractors']);
    }
  }

  loadContractorDetails(): void {
    this.isLoading = true;
    this.contractorService.getContractorById(this.contractorId).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.contractor = res.data;
          this.loadDocuments();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading contractor profile:', err);
      }
    });
  }

  loadDocuments(): void {
    this.documentService.getDocumentsForEntity('CONTRACTOR', this.contractorId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.documents = res.data;
        }
      },
      error: (err) => console.error('Error loading documents:', err)
    });
  }

  approveContractor(): void {
    if (!this.contractor) return;
    this.contractorService.approveContractor(this.contractorId).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadContractorDetails();
        } else {
          alert('Error: ' + res.message);
        }
      },
      error: (err) => alert(err.error?.message || 'Error')
    });
  }

  suspendAccount(): void {
    if (!this.contractor) return;
    if (confirm('Are you sure you want to suspend this contractor account? The user will be unable to log in.')) {
      this.contractorService.suspendContractor(this.contractorId).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadContractorDetails();
          } else {
            alert('Error suspending account: ' + res.message);
          }
        },
        error: (err) => alert(err.error?.message || 'Error occurred')
      });
    }
  }

  unsuspendAccount(): void {
    if (!this.contractor) return;
    this.contractorService.unsuspendContractor(this.contractorId).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadContractorDetails();
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
