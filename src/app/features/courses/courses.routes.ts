import { Routes } from '@angular/router';

export const coursesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./courses-list/courses-list.component').then(m => m.CoursesListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./course-detail/course-detail.component').then(m => m.CourseDetailComponent)
  }
];
