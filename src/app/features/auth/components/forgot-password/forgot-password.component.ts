import { Component } from '@angular/core';
import {HttpErrorResponse} from "@angular/common/http";
import {AuthService} from "../../../../core/services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  public email = '';
  public isLoading = false;
  public errorMessage = '';
  public successMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  /**
   * Sends forgot password request.
   */
  public onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const trimmedEmail = this.email.trim();

    if (!trimmedEmail) {
      this.errorMessage = 'Email is required.';
      return;
    }

    this.isLoading = true;

    this.authService.forgotPassword(trimmedEmail).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Reset link has been sent to your email.';
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message ||
          error.error?.error ||
          'Failed to send reset link. Please try again.';
      }
    });
  }

  /**
   * Navigates back to login page.
   */
  public goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
