import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AngularAuthService } from '@challenge/auth/frontend';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <!-- Logo/Brand -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-slate-900 mb-1">Jynx</h1>
          <p class="text-sm text-slate-600">Email Confirmation</p>
        </div>

        <!-- Confirmation Status -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div *ngIf="isLoading" class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 class="text-lg font-semibold text-slate-900 mb-2">Confirming your email...</h2>
            <p class="text-sm text-slate-600">Please wait while we verify your account.</p>
          </div>

          <div *ngIf="!isLoading && success" class="text-center">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-slate-900 mb-2">Email Confirmed!</h2>
            <p class="text-sm text-slate-600 mb-4">Your account has been successfully verified.</p>
            <button
              (click)="goToDashboard()"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
            >
              Go to Dashboard
            </button>
          </div>

          <div *ngIf="!isLoading && !success" class="text-center">
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-slate-900 mb-2">Confirmation Failed</h2>
            <p class="text-sm text-slate-600 mb-4">{{ errorMessage }}</p>
            <button
              (click)="goToLogin()"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Component-specific styles */
  `]
})
export class ConfirmComponent implements OnInit {
  isLoading = true;
  success = false;
  errorMessage = '';

  constructor(
    private authService: AngularAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.handleEmailConfirmation();
  }

  private handleEmailConfirmation() {
    // Get the URL hash (contains the access token)
    const hash = window.location.hash;
    console.log('URL hash:', hash);

    if (!hash) {
      this.handleError('No confirmation token found in URL');
      return;
    }

    // Parse the hash parameters
    const params = new URLSearchParams(hash.substring(1)); // Remove the # symbol
    const accessToken = params.get('access_token');
    const tokenType = params.get('token_type');
    const type = params.get('type');

    console.log('Parsed params:', { accessToken, tokenType, type });

    if (!accessToken) {
      this.handleError('Invalid confirmation token');
      return;
    }

    if (type !== 'signup') {
      this.handleError('Invalid confirmation type');
      return;
    }

    // Store the token and redirect to dashboard
    this.authService.setToken(accessToken);
    
    // Extract user info from token (basic JWT decode)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      console.log('Token payload:', payload);
      
      // Set user info
      const user = {
        id: payload.sub,
        email: payload.email,
        firstName: payload.user_metadata?.first_name || 'User',
        lastName: payload.user_metadata?.last_name || 'Name',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.authService.setCurrentUser(user);
      
      this.success = true;
      this.isLoading = false;
      
      // Auto-redirect after 2 seconds
      setTimeout(() => {
        this.goToDashboard();
      }, 2000);
      
    } catch (error) {
      console.error('Error parsing token:', error);
      this.handleError('Invalid token format');
    }
  }

  private handleError(message: string) {
    this.errorMessage = message;
    this.isLoading = false;
    this.success = false;
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
