import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'documents/1', pathMatch: 'full'},
  {
    path: 'documents/:id',
    loadComponent: () =>
      import('./features/document-viewer/document-viewer-page.component')
        .then(m => m.DocumentViewerPageComponent),
  },
];
