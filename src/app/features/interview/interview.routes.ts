import { Routes } from '@angular/router';

export const interviewRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./interview.component').then(m => m.InterviewComponent)
  },
  {
    path: 'result',
    loadComponent: () => import('./interview-result/interview-result.component').then(m => m.InterviewResultComponent)
  }
];
