import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-[calc(100vh-56px)] grid place-items-center bg-gradient-to-br from-gray-50 to-white">
      <div class="w-full max-w-md rounded-2xl border border-gray-200 bg-white/80 backdrop-blur p-8 shadow-xl">
        <div class="mb-6 text-center">
          <h1 class="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p class="mt-1 text-sm text-gray-600">Sign in to your workspace</p>
        </div>
        <form (ngSubmit)="submit()" #f="ngForm" class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              class="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              name="email" [(ngModel)]="email" type="email" placeholder="you@example.com" required />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              class="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              name="password" [(ngModel)]="password" type="password" placeholder="••••••••" required />
          </div>
          <button
            class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 font-medium text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
            [disabled]="loading">
            <svg *ngIf="loading" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle class="opacity-25" cx="12" cy="12" r="10" stroke-width="4"></circle><path class="opacity-75" d="M4 12a8 8 0 018-8" stroke-width="4"></path></svg>
            <span>{{ loading ? 'Signing in…' : 'Sign In' }}</span>
          </button>
          <div class="text-red-600 text-sm" *ngIf="error">{{ error }}</div>
        </form>
        <div class="mt-6 text-center text-sm text-gray-600">
          Don't have an account?
          <a routerLink="/auth/register" class="font-medium text-blue-600 hover:text-blue-700">Create one</a>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  email = '';
  password = '';
  loading = false;
  error = '';

  async submit() {
    this.error = '';
    try {
      this.loading = true;
      await this.auth.signInWithPassword(this.email, this.password);
    } catch (e: any) {
      this.error = e?.message || 'Login failed';
    } finally {
      this.loading = false;
    }
  }
}
