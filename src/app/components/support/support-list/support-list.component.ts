import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportService, SupportTicket, SupportMessage } from '../../../shared/services/support.service';
import { DocumentService } from '../../../shared/services/document.service';

@Component({
  selector: 'app-support-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-list.component.html',
  styleUrl: './support-list.component.scss'
})
export class SupportListComponent implements OnInit {
  private supportService = inject(SupportService);
  private documentService = inject(DocumentService);

  tickets: SupportTicket[] = [];
  filteredTickets: SupportTicket[] = [];
  isLoading: boolean = false;
  isRefreshing: boolean = false;

  // Search & Filters
  searchQuery: string = '';
  selectedStatusFilter: string = 'All';
  selectedCategoryFilter: string = 'All';
  selectedPriorityFilter: string = 'All';

  // Stats Counters
  totalTicketsCount: number = 0;
  openTicketsCount: number = 0;
  inProgressCount: number = 0;
  resolvedCount: number = 0;

  // Chat Drawer / Details Modal State
  @ViewChild('chatMessagesContainer') chatMessagesContainer?: ElementRef;
  selectedTicket: SupportTicket | null = null;
  isChatDrawerOpen: boolean = false;
  chatMessages: any[] = [];
  isLoadingMessages: boolean = false;
  replyMessageText: string = '';

  // File attachment in chat
  chatAttachmentFile: File | null = null;
  chatAttachmentPreviewName: string = '';
  chatAttachmentPreviewUrl: string = '';

  // Image Zoom Modal State
  zoomedImageUrl: string | null = null;

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.supportService.getTickets().subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isRefreshing = false;
        if (res && res.data) {
          this.tickets = res.data;
        } else {
          this.tickets = [];
        }
        this.applyFilters();
      },
      error: () => {
        this.isLoading = false;
        this.isRefreshing = false;
        this.tickets = [];
        this.applyFilters();
      }
    });
  }

  refreshData(): void {
    this.isRefreshing = true;
    this.loadTickets();
  }

  applyFilters(): void {
    let list = [...this.tickets];

    // Status filter
    if (this.selectedStatusFilter !== 'All') {
      list = list.filter(t => (t.status || '').toUpperCase() === this.selectedStatusFilter.toUpperCase());
    }

    // Category filter
    if (this.selectedCategoryFilter !== 'All') {
      list = list.filter(t => (t.category || '').toLowerCase() === this.selectedCategoryFilter.toLowerCase());
    }

    // Priority filter
    if (this.selectedPriorityFilter !== 'All') {
      list = list.filter(t => (t.priority || '').toUpperCase() === this.selectedPriorityFilter.toUpperCase());
    }

    // Search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(t =>
        (t.ticketNumber || '').toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.userName || '').toLowerCase().includes(q) ||
        (t.userPhone || '').toLowerCase().includes(q)
      );
    }

    this.filteredTickets = list;
    this.calculateStats();
  }

  calculateStats(): void {
    this.totalTicketsCount = this.tickets.length;
    this.openTicketsCount = this.tickets.filter(t => t.status === 'OPEN' || t.status === 'REOPENED').length;
    this.inProgressCount = this.tickets.filter(t => t.status === 'IN_PROGRESS').length;
    this.resolvedCount = this.tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatusFilter = 'All';
    this.selectedCategoryFilter = 'All';
    this.selectedPriorityFilter = 'All';
    this.applyFilters();
  }

  openChatDrawer(ticket: SupportTicket, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedTicket = ticket;
    this.isChatDrawerOpen = true;
    this.replyMessageText = '';
    this.removeChatAttachment();
    this.loadTicketMessages(ticket.id);
  }

  closeChatDrawer(): void {
    this.isChatDrawerOpen = false;
    this.selectedTicket = null;
    this.chatMessages = [];
  }

  loadTicketMessages(ticketId: number): void {
    this.isLoadingMessages = true;
    this.supportService.getTicketDetails(ticketId).subscribe({
      next: (res) => {
        this.isLoadingMessages = false;
        if (res && res.data) {
          if (res.data.ticket) {
            this.selectedTicket = res.data.ticket;
          }
          const msgs = res.data.messages || [];
          if (msgs.length > 0) {
            this.chatMessages = msgs;
          } else if (this.selectedTicket && this.selectedTicket.description) {
            this.chatMessages = [{
              id: 'desc-' + this.selectedTicket.id,
              senderRole: 'USER',
              message: this.selectedTicket.description,
              attachmentUrl: this.selectedTicket.attachmentUrl,
              attachmentName: this.selectedTicket.attachmentName,
              createdAt: this.selectedTicket.createdAt
            }];
          } else {
            this.chatMessages = [];
          }
        } else {
          this.chatMessages = [];
        }
        this.scrollToBottom();
      },
      error: () => {
        this.isLoadingMessages = false;
        this.chatMessages = [];
        this.scrollToBottom();
      }
    });
  }

  // File Attachment Handlers
  onChatFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.chatAttachmentFile = file;
      this.chatAttachmentPreviewName = file.name;
      this.chatAttachmentPreviewUrl = URL.createObjectURL(file);
    }
  }

  removeChatAttachment(): void {
    this.chatAttachmentFile = null;
    this.chatAttachmentPreviewName = '';
    this.chatAttachmentPreviewUrl = '';
  }

  // Send Reply from Admin
  onSendReply(): void {
    if ((!this.replyMessageText.trim() && !this.chatAttachmentFile) || !this.selectedTicket) return;

    const text = this.replyMessageText.trim();
    const file = this.chatAttachmentFile;
    const previewUrl = this.chatAttachmentPreviewUrl;
    const fileName = this.chatAttachmentPreviewName;

    this.replyMessageText = '';
    this.removeChatAttachment();

    if (file) {
      this.documentService.uploadDocument(file, 'SUPPORT_MESSAGE', this.selectedTicket.id, 'SUPPORT_CHAT_ATTACHMENT').subscribe({
        next: (res) => {
          let attachmentUrl = previewUrl;
          let attachmentName = fileName;
          if (res && res.data) {
            attachmentUrl = this.documentService.downloadDocumentUrl(res.data.id);
            attachmentName = res.data.fileName || fileName;
          }
          this.executeSendMessage(text, attachmentUrl, attachmentName);
        },
        error: () => {
          this.executeSendMessage(text, previewUrl, fileName);
        }
      });
    } else {
      this.executeSendMessage(text);
    }
  }

  private executeSendMessage(messageText: string, attachmentUrl?: string, attachmentName?: string): void {
    if (!this.selectedTicket) return;
    const ticketId = this.selectedTicket.id;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.supportService.sendMessage(ticketId, messageText, attachmentUrl, attachmentName).subscribe({
      next: (res) => {
        if (res && res.data) {
          const exists = this.chatMessages.some(m => m.id === res.data.id);
          if (!exists) {
            this.chatMessages.push(res.data);
            this.scrollToBottom();
          }
        }
        this.updateLocalTicketStatus('IN_PROGRESS');
      },
      error: () => {}
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        if (this.chatMessagesContainer?.nativeElement) {
          this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
        }
      } catch (err) {}
    }, 100);
  }

  // Update Status
  changeTicketStatus(newStatus: string): void {
    if (!this.selectedTicket) return;
    const ticketId = this.selectedTicket.id;
    this.supportService.updateTicketStatus(ticketId, newStatus).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.selectedTicket!.status = res.data.status;
        } else {
          this.selectedTicket!.status = newStatus;
        }
        this.updateLocalTicketStatus(newStatus);
      },
      error: () => {
        this.selectedTicket!.status = newStatus;
        this.updateLocalTicketStatus(newStatus);
      }
    });
  }

  private updateLocalTicketStatus(newStatus: string): void {
    if (!this.selectedTicket) return;
    const found = this.tickets.find(t => t.id === this.selectedTicket!.id);
    if (found) {
      found.status = newStatus;
      this.calculateStats();
      this.applyFilters();
    }
  }

  openImageZoom(url: string): void {
    this.zoomedImageUrl = url;
  }

  closeImageZoom(): void {
    this.zoomedImageUrl = null;
  }
}
