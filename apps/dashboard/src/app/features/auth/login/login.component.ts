import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularAuthService } from '@challenge/auth/frontend';
import { LoginDto } from '@challenge/data';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <!-- Logo/Brand -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-slate-900 mb-1">Jynx</h1>
          <p class="text-sm text-slate-600">Welcome back to your workspace</p>
        </div>

        <!-- Login Form -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold text-slate-900 mb-6 text-center">Sign In</h2>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Email Field -->
            <div>
              <label for="email" class="block text-xs font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
                [class.border-red-500]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              >
            </div>

            <!-- Password Field -->
            <div>
              <label for="password" class="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                formControlName="password"
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
                [class.border-red-500]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              >
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 rounded-md p-3">
              <p class="text-xs text-red-600">{{ errorMessage }}</p>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="loginForm.invalid || isLoading"
              class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
            >
              <span *ngIf="!isLoading">Sign In</span>
              <span *ngIf="isLoading" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </span>
            </button>
          </form>

          <!-- Register Link -->
          <div class="mt-4 text-center">
            <p class="text-xs text-slate-600">
              Don't have an account?
              <a routerLink="/auth/register" class="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                Sign up
              </a>
            </p>
          </div>
        </div>

        <!-- Demo Credentials -->
        <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h3 class="text-xs font-medium text-blue-900 mb-1">Demo Credentials</h3>
          <p class="text-xs text-blue-700">Email: admin@jynx.com • Password: password</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Inter font will be loaded globally */
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AngularAuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const loginDto: LoginDto = this.loginForm.value;

      this.authService.login(loginDto).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        }
      });
    }
  }
}