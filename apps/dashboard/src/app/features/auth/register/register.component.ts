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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
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