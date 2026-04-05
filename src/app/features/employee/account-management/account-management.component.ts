import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Account } from '../../client/models/account.model';
import { AccountService } from '../../client/services/account.service';
import { ToastService } from '../../../shared/services/toast.service';
import { NavbarComponent } from 'src/app/shared/components/navbar/navbar.component';

@Component({
  selector: 'app-account-management',
  templateUrl: './account-management.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  styleUrls: ['./account-management.component.scss']
})
export class AccountManagementComponent implements OnInit {
  allAccounts: Account[] = [];
  filteredAccounts: Account[] = [];

  searchQuery = '';
  isLoading = false;

  showConfirmModal = false;
  selectedAccount: Account | null = null;

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalFilteredElements = 0;

  constructor(
    private readonly accountService: AccountService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  private getLastName(fullName: string): string {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1
      ? parts[parts.length - 1].toLowerCase()
      : parts[0].toLowerCase();
  }

  private sortByLastName(): void {
    this.allAccounts.sort((a, b) =>
      this.getLastName(a.ownerName || '').localeCompare(
        this.getLastName(b.ownerName || '')
      )
    );
  }

  private matchesOwnerPrefix(ownerName: string, query: string): boolean {
    if (!query) return true;
    if (!ownerName) return false;

    const parts = ownerName
      .toLowerCase()
      .trim()
      .split(/\s+/);

    return parts.some((part) => part.startsWith(query));
  }

  private applyFilters(): void {
    const query = this.searchQuery.trim().toLowerCase();

    let filtered = this.allAccounts;

    if (query) {
      const isAccountSearch = /\d/.test(query);

      filtered = this.allAccounts.filter((acc) => {
        if (isAccountSearch) {
          return (acc.accountNumber || '').toLowerCase().startsWith(query);
        }

        return this.matchesOwnerPrefix(acc.ownerName || '', query);
      });
    }

    this.totalFilteredElements = filtered.length;
    this.currentPage = 0;
    this.updatePagedResults(filtered);
  }

  private updatePagedResults(sourceAccounts: Account[]): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredAccounts = sourceAccounts.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(sourceAccounts.length / this.pageSize);
  }

  onSearch(): void {
    this.applyFilters();
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.currentPage = 0;

    this.accountService.getAllAccountsPaginated(0, this.pageSize).subscribe({
      next: (response) => {
        const totalPages = response.totalPages || 1;
        let loadedPages = 1;
        const allAccounts: Account[] = this.mapResponseContent(response.content);

        if (totalPages === 1) {
          this.finishLoading(allAccounts);
          return;
        }

        const pageRequests = [];
        for (let page = 1; page < totalPages; page++) {
          pageRequests.push(
            this.accountService.getAllAccountsPaginated(page, this.pageSize)
          );
        }

        if (pageRequests.length === 0) {
          this.finishLoading(allAccounts);
          return;
        }

        let completedRequests = 0;
        pageRequests.forEach((request) => {
          request.subscribe({
            next: (pageResponse) => {
              allAccounts.push(...this.mapResponseContent(pageResponse.content));
              completedRequests++;

              if (completedRequests === pageRequests.length) {
                this.finishLoading(allAccounts);
              }
            },
            error: (err: HttpErrorResponse) => {
              this.isLoading = false;
              this.toastService.error(
                err.error?.message || 'Greška pri učitavanju računa.'
              );
            }
          });
        });
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.error(
          err.error?.message || 'Greška pri učitavanju računa.'
        );
      }
    });
  }

  private finishLoading(allAccounts: Account[]): void {
    this.allAccounts = allAccounts;
    this.sortByLastName();
    this.applyFilters();
    this.isLoading = false;
  }

  private mapResponseContent(content: any[]): Account[] {
    if (!content) return [];

    return content.map((item: any) => {
      const ownerName = `${item.ime || ''} ${item.prezime || ''}`.trim();
      const subtype = this.mapToSubtype(
        item.accountOwnershipType,
        item.tekuciIliDevizni
      );
      const accountNumber = item.brojRacuna || '';
      return {
        id: 0,
        name: ownerName,
        accountNumber: accountNumber,
        balance: 0,
        availableBalance: 0,
        reservedFunds: 0,
        currency: item.tekuciIliDevizni === 'devizni' ? 'EUR' : 'RSD',
        status: 'ACTIVE',
        subtype: subtype,
        ownerId: 0,
        ownerName: ownerName,
        employeeId: 0,
        maintenanceFee: 0,
        dailyLimit: 0,
        monthlyLimit: 0,
        dailySpending: 0,
        monthlySpending: 0,
        createdAt: new Date().toISOString(),
        expiryDate: '',
      } as Account;
    });
  }

  getOwnershipType(account: Account): string {
    const businessTypes = ['DOO', 'AD', 'FOUNDATION', 'FOREIGN_BUSINESS'];
    return businessTypes.includes(account.subtype) ? 'Poslovni' : 'Lični';
  }

  getAccountType(account: Account): string {
    const devizni = ['FOREIGN_PERSONAL', 'FOREIGN_BUSINESS'];
    return devizni.includes(account.subtype) ? 'Devizni' : 'Tekući';
  }

  getStatusLabel(status: Account['status']): string {
    if (status === 'ACTIVE') return 'Aktivan';
    if (status === 'INACTIVE') return 'Neaktivan';
    return status;
  }

  openConfirmModal(account: Account): void {
    this.selectedAccount = account;
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.selectedAccount = null;
  }

  confirmToggleAccountStatus(): void {
    if (!this.selectedAccount) return;

    const account = this.selectedAccount;
    const active = account.status === 'ACTIVE';
    const targetStatus = active ? 'INACTIVE' : 'ACTIVE';

    this.accountService
      .updateAccountStatus(account.accountNumber, targetStatus as 'ACTIVE' | 'INACTIVE')
      .subscribe({
        next: () => {
          try {
            account.status = targetStatus as Account['status'];
            this.applyFilters();

            this.toastService.success(
              `Račun je uspešno ${active ? 'deaktiviran' : 'aktiviran'}.`
            );

            this.closeConfirmModal();
          } catch (err) {
            this.toastService.error(
              `Greška pri ${active ? 'deaktivaciji' : 'aktivaciji'} računa.`
            );
            this.closeConfirmModal();
          }
        },
        error: (err: HttpErrorResponse) => {
          this.toastService.error(
            err.error?.message ||
              `Greška pri ${active ? 'deaktivaciji' : 'aktivaciji'} računa.`
          );
          this.closeConfirmModal();
        }
      });
  }

  openAccountCards(account: Account): void {
    this.router.navigate(['/account-cards'], {
      queryParams: {
        accountNumber: account.accountNumber,
        ownerName: account.ownerName,
        ownershipType: this.getOwnershipType(account),
        accountType: this.getAccountType(account),
        status: this.getStatusLabel(account.status)
      }
    });
  }

  trackByAccount(index: number, account: Account): string {
    return account.accountNumber;
  }

  private mapToSubtype(ownership: string, type: string): any {
    if (ownership === 'BUSINESS') {
      return type === 'devizni' ? 'FOREIGN_BUSINESS' : 'DOO';
    }
    return type === 'devizni' ? 'FOREIGN_PERSONAL' : 'STANDARD';
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.updatePagedResults(this.getFilteredAccountsList());
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagedResults(this.getFilteredAccountsList());
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagedResults(this.getFilteredAccountsList());
    }
  }

  private getFilteredAccountsList(): Account[] {
    const query = this.searchQuery.trim().toLowerCase();
    let filtered = this.allAccounts;

    if (query) {
      const isAccountSearch = /\d/.test(query);

      filtered = this.allAccounts.filter((acc) => {
        if (isAccountSearch) {
          return (acc.accountNumber || '').toLowerCase().startsWith(query);
        }

        return this.matchesOwnerPrefix(acc.ownerName || '', query);
      });
    }

    return filtered;
  }

  get isFirstPage(): boolean {
    return this.currentPage === 0;
  }

  get isLastPage(): boolean {
    return this.currentPage >= this.totalPages - 1;
  }
}