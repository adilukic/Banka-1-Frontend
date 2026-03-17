import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Account } from '../../models/account.model';

@Component({
  selector: 'app-account-details-modal',
  templateUrl: './account-details-modal.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./account-details-modal.component.scss']
})
export class AccountDetailsModalComponent {
  @Input() public account: Account | null = null;
  @Output() public close = new EventEmitter<void>();

  public closeModal(): void {
    this.close.emit();
  }
  //TODO: otvoriti modal za promenu naziva (F5)
  public onChangeAccountName(): void {
    console.log('Open change account name modal');
  }

  //TODO: navigate na stranicu za novo placanje (sledeci sprint)
  public onNewPayment(): void {
    console.log('Open new payment flow');
  }

  //TODO: otvoriti modal za promenu limita (F6)
  public onChangeLimit(): void {
    console.log('Open change limit flow');
  }

  /**
   * Vraća naziv tipa računa za detaljan prikaz.
   */
  public getAccountTypeLabel(): string {
    if (!this.account) {
      return '';
    }

    const labels: Record<string, string> = {
      STANDARD: 'Standardni tekući',
      SAVINGS: 'Štedni',
      PENSION: 'Penzionerski',
      YOUTH: 'Za mlade',
      STUDENT: 'Za studente',
      UNEMPLOYED: 'Za nezaposlene',
      DOO: 'Poslovni (DOO)',
      AD: 'Poslovni (AD)',
      FOUNDATION: 'Fondacija',
      FOREIGN_PERSONAL: 'Devizni lični',
      FOREIGN_BUSINESS: 'Devizni poslovni'
    };

    return labels[this.account.subtype] ?? this.account.name;
  }

  /**
   * Formatira brojčani iznos za prikaz.
   */
  public formatAmount(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}
