import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'customers/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'drivers/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'contractors/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
