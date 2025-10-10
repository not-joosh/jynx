import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularAuthService } from '@challenge/auth/frontend';
import { CreateUserDto } from '@challenge/data';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div class="max-w-lg w-full">
        <!-- Logo/Brand -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-slate-900 mb-1">Jynx</h1>
          <p class="text-sm text-slate-600">Create your account</p>
        </div>

        <!-- Registration Form -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold text-slate-900 mb-4 text-center">{{ getStepTitle() }}</h2>

          <!-- Compact Progress Indicator -->
          <div class="flex justify-center items-center mb-6">
            <div *ngFor="let step of [1, 2, 3]; let i = index" class="flex items-center">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300"
                [class.bg-blue-600]="currentStep >= step"
                [class.text-white]="currentStep >= step"
                [class.bg-slate-200]="currentStep < step"
                [class.text-slate-500]="currentStep < step"
              >
                {{ step }}
              </div>
              <div *ngIf="i < 2" class="w-8 h-0.5 mx-2" 
                   [class.bg-blue-600]="currentStep > step"
                   [class.bg-slate-200]="currentStep <= step">
              </div>
            </div>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Step 1: Personal Information -->
            <div *ngIf="currentStep === 1" class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="firstName" class="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    formControlName="firstName"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="John"
                    [class.border-red-500]="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched"
                  >
                </div>
                <div>
                  <label for="lastName" class="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    formControlName="lastName"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Doe"
                    [class.border-red-500]="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched"
                  >
                </div>
              </div>
              
              <div>
                <label for="email" class="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="john@example.com"
                  [class.border-red-500]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
                >
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="password" class="block text-xs font-medium text-slate-700 mb-1">Password</label>
                  <input
                    id="password"
                    type="password"
                    formControlName="password"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                    [class.border-red-500]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
                  >
                </div>
                <div>
                  <label for="confirmPassword" class="block text-xs font-medium text-slate-700 mb-1">Confirm</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    formControlName="confirmPassword"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                    [class.border-red-500]="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched"
                  >
                </div>
              </div>
            </div>

            <!-- Step 2: Organization Setup -->
            <div *ngIf="currentStep === 2" class="space-y-4">
              <div>
                <label for="organizationName" class="block text-xs font-medium text-slate-700 mb-1">Organization Name</label>
                <input
                  id="organizationName"
                  type="text"
                  formControlName="organizationName"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="My Company Inc."
                  [class.border-red-500]="registerForm.get('organizationName')?.invalid && registerForm.get('organizationName')?.touched"
                >
              </div>
              <div>
                <label for="organizationDescription" class="block text-xs font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  id="organizationDescription"
                  formControlName="organizationDescription"
                  rows="2"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Brief description of your organization"
                ></textarea>
              </div>
            </div>

            <!-- Step 3: Review & Complete -->
            <div *ngIf="currentStep === 3" class="space-y-4">
              <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 class="text-sm font-semibold text-slate-900 mb-3">Review Your Details</h3>
                <div class="space-y-2 text-xs text-slate-700">
                  <div class="flex justify-between">
                    <span class="font-medium">Name:</span>
                    <span>{{ registerForm.get('firstName')?.value }} {{ registerForm.get('lastName')?.value }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-medium">Email:</span>
                    <span>{{ registerForm.get('email')?.value }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="font-medium">Organization:</span>
                    <span>{{ registerForm.get('organizationName')?.value }}</span>
                  </div>
                  <div *ngIf="registerForm.get('organizationDescription')?.value" class="flex justify-between">
                    <span class="font-medium">Description:</span>
                    <span class="text-right max-w-48 truncate">{{ registerForm.get('organizationDescription')?.value }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Message (Error or Success) -->
            <div *ngIf="errorMessage" [class]="errorMessage.includes('sent you a new confirmation email') ? 'bg-green-50 border border-green-200 rounded-md p-3' : 'bg-red-50 border border-red-200 rounded-md p-3'">
              <p [class]="errorMessage.includes('sent you a new confirmation email') ? 'text-xs text-green-600' : 'text-xs text-red-600'">{{ errorMessage }}</p>
              <!-- Resend Confirmation Button -->
              <button
                *ngIf="showResendButton"
                type="button"
                (click)="resendConfirmation()"
                class="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
              >
                Resend confirmation email
              </button>
            </div>

            <!-- Navigation Buttons -->
            <div class="flex justify-between pt-2">
              <button
                type="button"
                *ngIf="currentStep > 1"
                (click)="prevStep()"
                class="px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-md transition-colors duration-200"
              >
                ← Previous
              </button>
              <button
                type="button"
                *ngIf="currentStep < 3"
                (click)="nextStep()"
                [disabled]="!isCurrentStepValid()"
                class="ml-auto px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium rounded-md transition-colors duration-200 disabled:cursor-not-allowed"
              >
                Next →
              </button>
              <button
                type="submit"
                *ngIf="currentStep === 3"
                [disabled]="registerForm.invalid || isLoading"
                class="ml-auto px-6 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-medium rounded-md transition-colors duration-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              >
                <span *ngIf="!isLoading">Complete Registration</span>
                <span *ngIf="isLoading" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              </button>
            </div>
          </form>

          <!-- Login Link -->
          <div class="mt-4 text-center">
            <p class="text-xs text-slate-600">
              Already have an account?
              <a routerLink="/auth/login" class="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Inter font will be loaded globally */
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  currentStep = 1;
  isLoading = false;
  errorMessage = '';
  showResendButton = false;

  constructor(
    private fb: FormBuilder,
    private authService: AngularAuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      organizationName: ['', [Validators.required]],
      organizationDescription: ['']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: any) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Personal Information';
      case 2: return 'Organization Setup';
      case 3: return 'Review & Complete';
      default: return 'Create Account';
    }
  }

  getStepLabel(step: number): string {
    switch (step) {
      case 1: return 'Personal';
      case 2: return 'Organization';
      case 3: return 'Review';
      default: return '';
    }
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!(this.registerForm.get('firstName')?.valid &&
               this.registerForm.get('lastName')?.valid &&
               this.registerForm.get('email')?.valid &&
               this.registerForm.get('password')?.valid &&
               this.registerForm.get('confirmPassword')?.valid &&
               !this.registerForm.errors?.['passwordMismatch']);
      case 2:
        return !!this.registerForm.get('organizationName')?.valid;
      case 3:
        return this.registerForm.valid;
      default:
        return false;
    }
  }

  nextStep() {
    if (this.isCurrentStepValid()) {
      this.currentStep++;
    }
  }

  prevStep() {
    this.currentStep--;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const createUserDto: CreateUserDto = {
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        firstName: this.registerForm.value.firstName,
        lastName: this.registerForm.value.lastName,
        organizationName: this.registerForm.value.organizationName
      };

      this.authService.register(createUserDto).subscribe({
        next: (response) => {
          this.isLoading = false;
          
          // Check if email confirmation is needed or if it's a resend message
          if (response.message && (response.message.includes('check your email') || response.message.includes('sent you a new confirmation email'))) {
            this.errorMessage = response.message;
            this.showResendButton = false; // Hide resend button since we already resent
            // Don't navigate to dashboard, show the message
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
          
          // Show resend button if user already exists but not confirmed
          if (error.error?.message?.includes('already exists but is not confirmed')) {
            this.showResendButton = true;
          } else {
            this.showResendButton = false;
          }
        }
      });
    }
  }

  resendConfirmation() {
    const email = this.registerForm.get('email')?.value;
    if (!email) {
      this.errorMessage = 'Please enter your email address first.';
      return;
    }

    this.authService.resendConfirmation(email).subscribe({
      next: (response) => {
        this.errorMessage = response.message;
        this.showResendButton = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to resend confirmation email.';
      }
    });
  }
}