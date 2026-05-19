import { Routes } from '@angular/router';

export const assessmentRoutes: Routes = [
  { path: '', redirectTo: 'mcq', pathMatch: 'full' },
  {
    path: 'mcq',
    loadComponent: () => import('./mcq/mcq.component').then(m => m.McqComponent)
  },
  {
    path: 'coding',
    loadComponent: () => import('./coding/coding.component').then(m => m.CodingComponent)
  }
];
