import { Route } from '@angular/router';
import { AngularAuthGuard, Permission, Role } from '@challenge/auth/frontend';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [AngularAuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/tasks.component').then(m => m.TasksComponent)
      },
      {
        path: 'members',
        loadComponent: () => import('./features/members/members.component').then(m => m.MembersComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications-inbox.component').then(m => m.NotificationsInboxComponent)
      }
    ]
  },
  // Top-level routes for cleaner URLs
  {
    path: 'tasks',
    loadComponent: () => import('./features/dashboard/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [AngularAuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/tasks/tasks.component').then(m => m.TasksComponent)
      }
    ]
  },
  {
    path: 'members',
    loadComponent: () => import('./features/dashboard/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [AngularAuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/members/members.component').then(m => m.MembersComponent)
      }
    ]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/dashboard/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [AngularAuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/dashboard/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [AngularAuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
      }
    ]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./features/dashboard/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [AngularAuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/notifications/notifications-inbox.component').then(m => m.NotificationsInboxComponent)
      }
    ]
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'confirm',
        loadComponent: () => import('./features/auth/confirm/confirm.component').then(m => m.ConfirmComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
