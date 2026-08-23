import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new BehaviorSubject<ToastInfo | null>(null);
  toast$ = this.toastSubject.asObservable();
  private timeoutId: any;

  show(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3500): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.toastSubject.next({ message, type });
    this.timeoutId = setTimeout(() => {
      this.clear();
    }, duration);
  }

  showSuccess(message: string, duration = 3500): void {
    this.show(message, 'success', duration);
  }

  showError(message: string, duration = 4000): void {
    this.show(message, 'error', duration);
  }

  showInfo(message: string, duration = 3500): void {
    this.show(message, 'info', duration);
  }

  clear(): void {
    this.toastSubject.next(null);
  }
}
