import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../../../core/services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpErrorResponse} from "@angular/common/http";

@Component({
  selector: 'app-activate-account',
  templateUrl: './activate-account.component.html',
  styleUrls: ['./activate-account.component.scss']
})
export class ActivateAccountComponent implements OnInit {
  public password = '';
  public confirmPassword = '';

  public isPasswordVisible = false;
  public isConfirmPasswordVisible = false;
  public isLoading = false;

  public hasValidActivationToken = false;
  public successMessage = '';
  public generalErrorMessage = '';

  public passwordTouched = false;
  public confirmPasswordTouched = false;

  public passwordErrorMessage = '';
  public confirmPasswordErrorMessage = '';

  private confirmationToken = '';
  private activationId: number | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router
  ) {}

  public ngOnInit(): void {
    this.confirmationToken = this.activatedRoute.snapshot.queryParamMap.get('token') ?? '';

    if (!this.confirmationToken.trim()) {
      this.hasValidActivationToken = false;
      this.generalErrorMessage =
        'This page must be opened using the account activation link sent to your email.';
      return;
    }

    this.isLoading = true;

    this.authService.checkActivateToken(this.confirmationToken).subscribe({
      next: (id: number) => {
        this.activationId = id;
        this.hasValidActivationToken = true;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.hasValidActivationToken = false;
        this.isLoading = false;
        this.generalErrorMessage =
          error.error?.message ||
          'This activation link is invalid or expired.';
      }
    });
  }

  public togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  public toggleConfirmPasswordVisibility(): void {
    this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible;
  }

  public goToLogin(): void {
    this.router.navigate(['/login']);
  }

  public onPasswordBlur(): void {
    this.passwordTouched = true;
    this.validatePasswordField();
    this.validateConfirmPasswordField();
  }

  public onConfirmPasswordBlur(): void {
    this.confirmPasswordTouched = true;
    this.validateConfirmPasswordField();
  }

  public onPasswordInput(): void {
    if (this.passwordTouched) {
      this.validatePasswordField();
    }

    if (this.confirmPasswordTouched) {
      this.validateConfirmPasswordField();
    }
  }

  public onConfirmPasswordInput(): void {
    if (this.confirmPasswordTouched) {
      this.validateConfirmPasswordField();
    }
  }

  public get hasMinLength(): boolean {
    return this.password.length >= 8;
  }

  public get hasMaxLength(): boolean {
    return this.password.length <= 32;
  }

  public get hasUppercaseLetter(): boolean {
    return /[A-Z]/.test(this.password);
  }

  public get hasLowercaseLetter(): boolean {
    return /[a-z]/.test(this.password);
  }

  public get hasTwoDigits(): boolean {
    const digitMatches = this.password.match(/\d/g);
    return !!digitMatches && digitMatches.length >= 2;
  }

  public get hasNoSpaces(): boolean {
    return !/\s/.test(this.password);
  }

  public get isFormValid(): boolean {
    if (!this.hasValidActivationToken) {
      return false;
    }

    return (
      this.password.length > 0 &&
      this.confirmPassword.length > 0 &&
      !this.getPasswordValidationMessage(this.password) &&
      !this.getConfirmPasswordValidationMessage(this.password, this.confirmPassword)
    );
  }

  public onSubmit(): void {
    this.successMessage = '';
    this.generalErrorMessage = '';
    this.passwordTouched = true;
    this.confirmPasswordTouched = true;

    this.validatePasswordField();
    this.validateConfirmPasswordField();

    if (!this.hasValidActivationToken || this.activationId === null) {
      this.generalErrorMessage = 'This activation link is invalid or expired.';
      return;
    }

    if (this.passwordErrorMessage || this.confirmPasswordErrorMessage) {
      return;
    }

    this.isLoading = true;

    this.authService.activateAccount(this.activationId, this.confirmationToken, this.password.trim()).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Account successfully activated. Redirecting to login...';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1400);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.generalErrorMessage =
          error.error?.message ||
          error.error?.error ||
          'Failed to activate account. Please try again.';
      }
    });
  }

  private validatePasswordField(): void {
    this.passwordErrorMessage = this.getPasswordValidationMessage(this.password);
  }

  private validateConfirmPasswordField(): void {
    this.confirmPasswordErrorMessage = this.getConfirmPasswordValidationMessage(
      this.password,
      this.confirmPassword
    );
  }

  private getPasswordValidationMessage(password: string): string {
    const trimmedPassword = password.trim();

    if (!trimmedPassword) {
      return 'Password is required.';
    }

    if (trimmedPassword.length < 8) {
      return 'Password must be at least 8 characters long.';
    }

    if (trimmedPassword.length > 32) {
      return 'Password must be at most 32 characters long.';
    }

    if (!/[A-Z]/.test(trimmedPassword)) {
      return 'Password must contain at least one uppercase letter.';
    }

    if (!/[a-z]/.test(trimmedPassword)) {
      return 'Password must contain at least one lowercase letter.';
    }

    const digitMatches = trimmedPassword.match(/\d/g);
    if (!digitMatches || digitMatches.length < 2) {
      return 'Password must contain at least two digits.';
    }

    if (/\s/.test(trimmedPassword)) {
      return 'Password must not contain spaces.';
    }

    return '';
  }

  private getConfirmPasswordValidationMessage(
    password: string,
    confirmPassword: string
  ): string {
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedConfirmPassword) {
      return 'Confirm password is required.';
    }

    if (password.trim() !== trimmedConfirmPassword) {
      return 'Passwords do not match.';
    }

    return '';
  }
}
