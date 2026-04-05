import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { AccountService } from '../services/account.service';
import { Account } from '../models/account.model';
import { Transaction } from '../models/transaction.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  // ── Računi ──────────────────────────────────
  accounts: Account[] = [];
  selectedAccount: Account | null = null;
  loading = true;
  error = false;

  // ── Transakcije ──────────────────────────────
  transactions: Transaction[] = [];
  transactionsLoading = false;
  transactionsError = false;

  constructor(
    private authService: AuthService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    this.error = false;

    this.accountService.getMyAccounts().subscribe({
      next: (data: Account[]) => {
        this.accounts = data ?? [];
        // Automatski selektuje prvi račun i učitava njegove transakcije
        if (this.accounts.length > 0) {
          this.selectAccount(this.accounts[0]);
        }
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  // ── Selekcija računa + refresh transakcija ───

  selectAccount(account: Account): void {
    this.selectedAccount = account;
    this.loadTransactions(account.accountNumber);
  }

  isSelected(account: Account): boolean {
    return this.selectedAccount?.id === account.id;
  }

  loadTransactions(accountNumber: string): void {
    this.transactionsLoading = true;
    this.transactionsError = false;
    this.transactions = [];

    this.accountService.getTransactions(accountNumber, 0, 5).subscribe({
      next: (data: Transaction[]) => {
        this.transactions = data ?? [];
        this.transactionsLoading = false;
      },
      error: () => {
        this.transactionsError = true;
        this.transactionsLoading = false;
      }
    });
  }

  // ── Auth ─────────────────────────────────────

  logout(): void {
    this.authService.logout();
  }

  // ── Helpers ──────────────────────────────────

  get totalAvailableBalance(): number {
    let total = 0;
    for (const account of this.accounts) {
      total += account.availableBalance;
    }
    return total;
  }

  formatAmount(amount: number, currency: string = 'RSD'): string {
    const fixed = Math.round(amount * 100) / 100;
    const str = String(fixed);
    const dotIndex = str.indexOf('.');
    const intPart = dotIndex >= 0 ? str.slice(0, dotIndex) : str;
    const decPart = dotIndex >= 0 ? str.slice(dotIndex + 1).padEnd(2, '0') : '00';
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intFormatted},${decPart} ${currency}`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  getBalancePercent(account: Account): number {
    if (account.balance === 0) return 0;
    const percent = (account.availableBalance / account.balance) * 100;
    if (percent > 100) return 100;
    if (percent < 0) return 0;
    return percent;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'status--completed',
      PENDING: 'status--pending',
      FAILED: 'status--failed',
      CANCELLED: 'status--cancelled'
    };
    return map[status] ?? 'status--pending';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'Odobreno',
      PENDING: 'Čekanje',
      FAILED: 'Odbijeno',
      CANCELLED: 'Otkazano'
    };
    return map[status] ?? status;
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      PAYMENT: 'Plaćanje',
      TRANSFER: 'Transfer',
      DEPOSIT: 'Uplata',
      WITHDRAWAL: 'Isplata'
    };
    return map[type] ?? type;
  }
}
