import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-verification-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verification-modal.component.html',
  styleUrls: ['./verification-modal.component.scss']
})
export class VerificationModalComponent implements OnInit {
  @Input() operationType: string = 'TRANSFER';
  @Input() relatedEntityId: string = '';

  @Output() confirmed = new EventEmitter<number>();
  @Output() closed = new EventEmitter<void>();

  verificationCode: string = '';
  attempts: number = 0;
  readonly maxAttempts: number = 3;
  isSendingCode = false;
  sessionId: number | null = null;

  constructor(
    private toastService: ToastService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.sendVerificationCode();
  }

  sendVerificationCode(): void {
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
        operationType: this.operationType,
        relatedEntityId: this.relatedEntityId,
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

  onConfirm(): void {
    if (!this.verificationCode || this.verificationCode.length < 6 || this.sessionId === null) return;

    this.http.post(
      `${environment.apiUrl}/verification/validate`,
      { sessionId: this.sessionId, code: this.verificationCode },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.confirmed.emit(this.sessionId!);
      },
      error: () => {
        this.attempts++;
        if (this.attempts >= this.maxAttempts) {
          this.toastService.error('Transakcija je otkazana zbog previše neuspešnih pokušaja.');
          this.closed.emit();
        } else {
          this.toastService.warning(`Pogrešan kod. Preostalo pokušaja: ${this.maxAttempts - this.attempts}`);
        }
      }
    });
  }

  onClose(): void {
    this.closed.emit();
  }
}
