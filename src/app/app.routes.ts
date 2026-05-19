import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'courses',
    loadChildren: () => import('./features/courses/courses.routes').then(m => m.coursesRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'assessment',
    loadChildren: () => import('./features/assessment/assessment.routes').then(m => m.assessmentRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'interview',
    loadChildren: () => import('./features/interview/interview.routes').then(m => m.interviewRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'certificate/:id',
    loadComponent: () => import('./features/certificate/certificate.component').then(m => m.CertificateComponent),
    canActivate: [authGuard]
  },
  {
    path: 'chatbot',
    loadComponent: () => import('./features/chatbot/chatbot.component').then(m => m.ChatbotComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];
