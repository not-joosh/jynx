import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AngularAuthService } from '@challenge/auth/frontend';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.css']
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

    // Exchange Supabase token for our backend JWT with full user data
    this.authService.confirmEmail(accessToken).subscribe({
      next: (response) => {
        console.log('✅ Email confirmation successful, user data:', response.user);
        this.success = true;
        this.isLoading = false;
        
        // Auto-redirect after 2 seconds
        setTimeout(() => {
          this.goToDashboard();
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Error confirming email:', error);
        this.handleError(error.error?.message || 'Failed to confirm email. Please try logging in.');
      }
    });
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
