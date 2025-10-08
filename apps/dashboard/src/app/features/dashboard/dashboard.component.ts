import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserDto, TaskDto } from '@challenge/data';
import { StringUtils, DateUtils } from '@challenge/utils';
import { environment } from '../../../environments/environment';
import { AngularAuthService, Permission, Role } from '@challenge/auth/frontend';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <h1 class="text-2xl font-bold text-slate-900">Jynx</h1>
            </div>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-slate-600">
                Welcome, {{ currentUser?.firstName }} {{ currentUser?.lastName }}
              </span>
              <button
                (click)="onLogout()"
                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h2 class="text-3xl font-bold text-slate-900 mb-2">Dashboard</h2>
          <p class="text-slate-600">Welcome to your task management workspace</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- User Section -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">User Info</h3>
            <div class="space-y-2">
              <p class="text-sm text-slate-600">
                <span class="font-medium">Email:</span> {{ currentUser?.email }}
              </p>
              <p class="text-sm text-slate-600">
                <span class="font-medium">Name:</span> {{ currentUser?.firstName }} {{ currentUser?.lastName }}
              </p>
              <p class="text-sm text-slate-600">
                <span class="font-medium">Member since:</span> {{ formattedDate }}
              </p>
            </div>
            <!-- Only show if user has permission to update profile -->
            <button
              *ngIf="authService.hasPermission(Permission.USER_UPDATE)"
              (click)="onUserAction()"
              class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Update Profile
            </button>

            <!-- Only show for admins and owners -->
            <button
              *ngIf="authService.hasRole(Role.ADMIN) || authService.hasRole(Role.OWNER)"
              (click)="onAdminAction()"
              class="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Admin Panel
            </button>
          </div>

          <!-- Tasks Section -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">Tasks</h3>
            <p class="text-slate-600 mb-4">Manage your tasks and projects</p>
            <!-- Only show if user has permission to read tasks -->
            <button
              *ngIf="authService.hasPermission(Permission.TASK_READ)"
              (click)="onTaskAction()"
              class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              View Tasks
            </button>

            <!-- Only show if user has permission to create tasks -->
            <button
              *ngIf="authService.hasPermission(Permission.TASK_CREATE)"
              (click)="onCreateTask()"
              class="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Create Task
            </button>
          </div>

          <!-- Quick Stats -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-sm text-slate-600">Active Tasks</span>
                <span class="text-sm font-medium text-slate-900">12</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-slate-600">Completed</span>
                <span class="text-sm font-medium text-slate-900">8</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-slate-600">In Progress</span>
                <span class="text-sm font-medium text-slate-900">4</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Debug Info -->
        <div class="mt-8 bg-slate-100 p-4 rounded-lg">
          <h3 class="font-semibold mb-2 text-slate-900">Debug Info:</h3>
          <div class="text-sm text-slate-600 space-y-1">
            <p>Config loaded: {{ configLoaded }}</p>
            <p>Sample string: {{ sampleString }}</p>
            <p>Formatted date: {{ formattedDate }}</p>
            <p>User authenticated: {{ isAuthenticated }}</p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    /* Component-specific styles can go here */
  `]
})
export class DashboardComponent {
  // RBAC enums for template usage
  Permission = Permission;
  Role = Role;

  configLoaded = !!environment.supabase.url;
  sampleString = StringUtils.capitalize('hello world');
  formattedDate = DateUtils.formatDate(new Date(), 'long');
  currentUser: any = null;
  isAuthenticated = false;

  constructor(
    public authService: AngularAuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  onUserAction() {
    console.log('User action clicked!');
    // Example of using the shared DTOs
    const user: UserDto = {
      id: '1',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('User:', user);
  }

  onTaskAction() {
    console.log('Task action clicked!');
    // Example of using the shared DTOs
    const task: TaskDto = {
      id: '1',
      title: 'Sample Task',
      description: 'This is a sample task',
      status: 'todo' as any,
      priority: 'medium' as any,
      organizationId: '1',
      creatorId: '1',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('Task:', task);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  onAdminAction() {
    console.log('Admin action clicked!');
    this.router.navigate(['/admin']);
  }

  onCreateTask() {
    console.log('Create task clicked!');
    // Navigate to task creation or open modal
  }
}
