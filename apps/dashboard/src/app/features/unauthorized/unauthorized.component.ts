import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div class="max-w-md w-full text-center">
        <!-- Error Icon -->
        <div class="mb-8">
          <div class="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
        </div>

        <!-- Error Message -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-red-900 mb-4">Access Denied</h1>
          <p class="text-red-700 mb-6">
            You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-4">
          <button
            routerLink="/dashboard"
            class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Go to Dashboard
          </button>
          
          <button
            (click)="goBack()"
            class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </div>

        <!-- Help Text -->
        <div class="mt-8 text-sm text-red-600">
          <p>Need help? Contact support or check your role permissions.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Component-specific styles can go here */
  `]
})
export class UnauthorizedComponent {
  goBack() {
    window.history.back();
  }
}
