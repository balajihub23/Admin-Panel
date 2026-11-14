import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SnackbarComponent } from './shared/components/snackbar/snackbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SnackbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'jcbAdmin';
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('unhandledrejection', (event) => {
        const reason =
          event?.reason?.message ||
          (typeof event?.reason === 'string' ? event.reason : '') ||
          event?.reason?.toString?.() ||
          '';

        const isChunkFailed =
          /Loading chunk|Failed to fetch dynamically imported module|Expected a JavaScript-or-Wasm module script|Failed to load module script/i.test(
            reason
          );

        if (isChunkFailed) {
          const key = 'chunk_reload_timestamp';
          const lastReload = Number(sessionStorage.getItem(key) || 0);
          const now = Date.now();

          if (now - lastReload > 10000) {
            sessionStorage.setItem(key, String(now));
            window.location.reload();
          }
        }
      });
    }
  }
}
