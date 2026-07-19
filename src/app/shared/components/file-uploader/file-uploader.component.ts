import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-uploader.component.html',
  styleUrl: './file-uploader.component.scss'
})
export class FileUploaderComponent implements OnChanges {
  private documentService = inject(DocumentService);

  @Input() label = 'Upload Document';
  @Input() accept = 'image/*,application/pdf';
  @Input() required = false;
  @Input() entityType = 'DRIVER'; // DRIVER or CONTRACTOR
  @Input() documentType = 'DOCUMENT'; // DRIVING_LICENSE, GST_CERTIFICATE etc.

  // Preloaded/existing file inputs (for Edit mode)
  @Input() initialFileName: string | null = null;
  @Input() initialFileUrl: string | null = null;
  @Input() initialFileId: number | null = null;

  @Output() uploadSuccess = new EventEmitter<number>();
  @Output() docCleared = new EventEmitter<number>();

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isDragOver = false;
  isUploading = false;
  uploadedDocId: number | null = null;
  uploadError = '';

  ngOnChanges(changes: SimpleChanges): void {
    // Only reset internal upload state when the parent explicitly clears the file (null)
    // Do NOT reset when transitioning from null -> id (async load), as that would hide the loaded doc
    if (changes['initialFileId']) {
      const prev = changes['initialFileId'].previousValue;
      const curr = changes['initialFileId'].currentValue;
      // Only clear if we are switching to a completely different entity (null -> null or id change with cleared file)
      if (curr === null && prev !== null) {
        // Parent explicitly cleared: reset upload state
        this.selectedFile = null;
        this.previewUrl = null;
        this.uploadedDocId = null;
        this.uploadError = '';
      }
    }
  }

  isInitialImage(): boolean {
    if (!this.initialFileName) return false;
    const ext = this.initialFileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileChange(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.handleFile(event.target.files[0]);
    }
  }

  handleFile(file: File): void {
    this.selectedFile = file;
    this.uploadError = '';

    // Generate local preview if it is an image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = null;
    }

    // Trigger immediate upload with temporary entity ID 0
    this.isUploading = true;
    this.documentService.uploadDocument(file, this.entityType, 0, this.documentType).subscribe({
      next: (res) => {
        this.isUploading = false;
        if (res.success && res.data) {
          this.uploadedDocId = res.data.id;
          this.uploadSuccess.emit(res.data.id);
        } else {
          this.uploadError = res.message || 'Upload failed';
        }
      },
      error: (err) => {
        this.isUploading = false;
        this.uploadError = err.error?.message || err.message || 'Connection error';
        console.error('File upload error:', err);
      }
    });
  }

  clearSelection(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Determine which ID to delete: newly uploaded doc ID or the preloaded initial file ID
    const docIdToDelete = this.uploadedDocId || this.initialFileId;
    
    // Reset local and preloaded states
    this.selectedFile = null;
    this.previewUrl = null;
    this.uploadedDocId = null;
    this.initialFileName = null;
    this.initialFileUrl = null;
    this.initialFileId = null;
    this.uploadError = '';

    if (docIdToDelete) {
      this.docCleared.emit(docIdToDelete);
      // Immediately delete file from server
      this.documentService.deleteDocument(docIdToDelete).subscribe({
        next: (res) => {
          logInfo('Document deleted from server successfully:', docIdToDelete);
        },
        error: (err) => {
          console.error('Failed to delete document from server:', docIdToDelete, err);
        }
      });
    }
  }

  getFileSizeString(): string {
    if (!this.selectedFile) return '';
    const bytes = this.selectedFile.size;
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    const mb = kb / 1024;
    return mb.toFixed(1) + ' MB';
  }
}

// Simple console logger proxy to avoid template errors in SSR
function logInfo(...args: any[]) {
  console.log('[FileUploader]', ...args);
}
