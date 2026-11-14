import { ErrorHandler, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChunkLoadErrorHandler implements ErrorHandler {
  private readonly RELOAD_KEY = 'chunk_reload_timestamp';
  private readonly COOLDOWN_MS = 10000; // 10 seconds cooldown to prevent reload loops

  handleError(error: any): void {
    const errorMessage =
      error?.message ||
      (typeof error === 'string' ? error : '') ||
      error?.toString?.() ||
      '';

    const isChunkFailed =
      /Loading chunk|Failed to fetch dynamically imported module|Expected a JavaScript-or-Wasm module script|Failed to load module script|error loading dynamically imported module/i.test(
        errorMessage
      );

    if (isChunkFailed && typeof window !== 'undefined') {
      const lastReload = Number(sessionStorage.getItem(this.RELOAD_KEY) || 0);
      const now = Date.now();

      if (now - lastReload > this.COOLDOWN_MS) {
        sessionStorage.setItem(this.RELOAD_KEY, String(now));
        window.location.reload();
        return;
      }
    }

    console.error(error);
  }
}
