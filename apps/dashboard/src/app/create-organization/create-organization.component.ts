import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-[calc(100vh-56px)] grid place-items-center bg-gradient-to-br from-gray-50 to-white">
      <div class="w-full max-w-md rounded-2xl border border-gray-200 bg-white/80 backdrop-blur p-8 shadow-xl">
        <div class="mb-6 text-center">
          <h1 class="text-3xl font-semibold tracking-tight">Create Your Organization</h1>
          <p class="mt-1 text-sm text-gray-600">Set up your workspace to start collaborating</p>
        </div>
        <form (ngSubmit)="submit()" #f="ngForm" class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Organization Name</label>
            <input
              class="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              name="organizationName" [(ngModel)]="organizationName" type="text" placeholder="Acme Corp" required />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              class="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              name="description" [(ngModel)]="description" rows="3" placeholder="Tell us about your organization..."></textarea>
          </div>
          <button
            class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 font-medium text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
            [disabled]="loading">
            <svg *ngIf="loading" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle class="opacity-25" cx="12" cy="12" r="10" stroke-width="4"></circle><path class="opacity-75" d="M4 12a8 8 0 018-8" stroke-width="4"></path></svg>
            <span>{{ loading ? 'Creating…' : 'Create Organization' }}</span>
          </button>
          <div class="text-red-600 text-sm" *ngIf="error">{{ error }}</div>
          <div class="text-green-700 text-sm" *ngIf="notice">{{ notice }}</div>
        </form>
        <div class="mt-6 text-center text-sm text-gray-600">
          <a routerLink="/auth/login" class="font-medium text-blue-600 hover:text-blue-700">Back to login</a>
        </div>
      </div>
    </div>
  `,
})
export class CreateOrganizationComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  
  organizationName = '';
  description = '';
  loading = false;
  error = '';
  notice = '';

  async submit() {
    this.error = '';
    this.notice = '';
    this.loading = true;
    
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('No user found. Please login again.');
      }

      // Get Supabase user ID from token
      const token = this.auth.token;
      if (!token) {
        throw new Error('No authentication token found.');
      }

      // Create organization with user
      const result = await this.auth.createUserWithOrganization(
        currentUser.email,
        currentUser.id, // This should be the Supabase user ID
        this.organizationName
      );

      this.notice = 'Organization created successfully! Redirecting...';
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        this.router.navigate(['/tasks']);
      }, 1500);
    } catch (e: any) {
      this.error = e?.message || 'Failed to create organization';
    } finally {
      this.loading = false;
    }
  }
}
