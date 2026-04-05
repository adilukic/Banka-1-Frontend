import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Account } from '../../models/account.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-change-limit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-limit-modal.component.html',
  styleUrls: ['./change-limit-modal.component.css']
})
export class ChangeLimitModalComponent implements OnInit {
  @Input() public account!: Account;
  @Output() public close = new EventEmitter<void>();
  @Output() public limitUpdated = new EventEmitter<void>();

  public limitForm!: FormGroup;
  public isSubmitting = false;
  public isSendingCode = false;
  public sessionId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private toastService: ToastService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.generateOtp();
  }

  private initForm(): void {
    this.limitForm = this.fb.group(
      {
        dailyLimit: [this.account?.dailyLimit || 0, [Validators.required, Validators.min(0)]],
        monthlyLimit: [this.account?.monthlyLimit || 0, [Validators.required, Validators.min(0)]],
        otpCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
      },
      { validators: this.limitValidator }
    );
  }

  private limitValidator(control: AbstractControl): ValidationErrors | null {
    const daily = control.get('dailyLimit')?.value;
    const monthly = control.get('monthlyLimit')?.value;
    if (daily !== null && monthly !== null && monthly < daily) {
      return { invalidLimits: true };
    }
    return null;
  }

  public generateOtp(): void {
    this.isSendingCode = true;
    const clientId = this.authService.getUserIdFromToken();
    const clientEmail = this.authService.getLoggedUser()?.email;

    if (!clientId || !clientEmail) {
      this.toastService.error('Nije moguće poslati verifikacioni kod.');
      this.isSendingCode = false;
      return;
    }

    this.http.post<{ sessionId: number }>(
      `${environment.apiUrl}/verification/generate`,
      {
        clientId,
        operationType: 'LIMIT_CHANGE',
        relatedEntityId: this.account.accountNumber,
        clientEmail
      }
    ).subscribe({
      next: (res) => {
        this.sessionId = res.sessionId;
        this.isSendingCode = false;
        this.toastService.info('Verifikacioni kod je poslat na vaš email.');
      },
      error: () => {
        this.isSendingCode = false;
        this.toastService.error('Greška pri slanju verifikacionog koda.');
      }
    });
  }

  public onClose(): void {
    this.close.emit();
  }

  public onSubmit(): void {
    if (this.limitForm.invalid || this.sessionId === null) {
      this.limitForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { dailyLimit, monthlyLimit, otpCode } = this.limitForm.value;

    this.http.post(
      `${environment.apiUrl}/verification/validate`,
      { sessionId: this.sessionId, code: otpCode },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.accountService.changeLimit(
          this.account.accountNumber,
          dailyLimit,
          monthlyLimit,
          this.sessionId!
        ).subscribe({
          next: () => {
            this.toastService.success('Limiti računa su uspešno ažurirani.');
            this.isSubmitting = false;
            this.account.dailyLimit = dailyLimit;
            this.account.monthlyLimit = monthlyLimit;
            this.limitUpdated.emit();
          },
          error: (err) => {
            const errorMessage = err.error?.message || 'Greška pri ažuriranju limita.';
            this.toastService.error(errorMessage);
            this.isSubmitting = false;
          }
        });
      },
      error: () => {
        this.toastService.error('Pogrešan verifikacioni kod.');
        this.isSubmitting = false;
      }
    });
  }
}
