import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withNavigationErrorHandler } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { jwtInterceptor } from './shared/interceptors/jwt.interceptor';
import { ChunkLoadErrorHandler } from './shared/handlers/chunk-error.handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(
      routes,
      withNavigationErrorHandler((navError) => {
        const err = navError?.error;
        const message =
          err?.message ||
          (typeof err === 'string' ? err : '') ||
          err?.toString?.() ||
          '';

        const isChunkFailed =
          /Loading chunk|Failed to fetch dynamically imported module|Expected a JavaScript-or-Wasm module script|Failed to load module script/i.test(
            message
          );

        if (isChunkFailed && typeof window !== 'undefined') {
          const key = 'chunk_reload_timestamp';
          const lastReload = Number(sessionStorage.getItem(key) || 0);
          const now = Date.now();

          if (now - lastReload > 10000) {
            sessionStorage.setItem(key, String(now));
            window.location.href = navError.url || window.location.href;
          }
        }
      })
    ), 
    provideHttpClient(withInterceptors([jwtInterceptor]), withFetch()),
    { provide: ErrorHandler, useClass: ChunkLoadErrorHandler }
  ]
};
