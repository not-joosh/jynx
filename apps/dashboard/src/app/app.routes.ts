import { Route } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const appRoutes: Route[] = [
  // Public auth routes (NOT guarded)
  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent) },
      { path: 'create-organization', loadComponent: () => import('./create-organization/create-organization.component').then(m => m.CreateOrganizationComponent) },
    ],
  },

  // App shell and protected areas
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'tasks', loadComponent: () => import('./tasks-home/tasks-home.component').then(m => m.TasksHomeComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'tasks' },
    ],
  },

  { path: '**', redirectTo: '' },
];
