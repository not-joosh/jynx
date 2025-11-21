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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showResendButton = false;
  resendMessage = '';

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
          
          console.log('Login error:', error);
          console.log('Error message:', error.error?.message);
          
          // Show resend button if email confirmation is needed
          if (error.error?.message?.includes('check your email') || error.error?.message?.includes('confirmation link')) {
            this.showResendButton = true;
            console.log('Showing resend button');
          } else {
            this.showResendButton = false;
            console.log('Not showing resend button');
          }
        }
      });
    }
  }

  resendConfirmation() {
    const email = this.loginForm.get('email')?.value;
    console.log('Resending confirmation for email:', email);
    
    if (!email) {
      this.resendMessage = 'Please enter your email address first.';
      return;
    }

    this.authService.resendConfirmation(email).subscribe({
      next: (response) => {
        console.log('Resend confirmation success:', response);
        this.resendMessage = response.message;
        this.showResendButton = false;
      },
      error: (error) => {
        console.log('Resend confirmation error:', error);
        this.resendMessage = error.error?.message || 'Failed to resend confirmation email.';
      }
    });
  }
}