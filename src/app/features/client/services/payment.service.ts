import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map, switchMap, catchError } from 'rxjs/operators';
import { environment } from './../../../../environments/environment';
import { Payment, PaymentPage, PaymentFilters, PaymentStatus } from '../models/payment.model';
import { AccountService } from './account.service';

/** Backend response structure */
interface BackendPayment {
  createdAt: string;
  exchangeRate: number | null;
  finalAmount: number;
  fromAccountNumber: string;
  fromCurrency: string;
  initialAmount: number;
  orderNumber: string;
  paymentCode: string;
  paymentPurpose: string;
  recipientName: string;
  referenceNumber: string | null;
  status: string;
  toAccountNumber: string;
  toCurrency: string;
}

interface BackendPaymentPage {
  content: BackendPayment[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly baseUrl = `${environment.apiUrl}/transactions/api/payments`;
  private accountService: AccountService | null = null;
  private accountCache: { [key: string]: string } = {};

  constructor(
    private readonly http: HttpClient,
    private readonly injector: Injector
  ) {
    // Lazy load AccountService to avoid circular dependencies
  }

  /**
   * Dohvata listu plaćanja sa filterima i paginacijom.
   */
  public getPayments(
    filters: PaymentFilters = {},
    page = 0,
    size = 10
  ): Observable<PaymentPage> {    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (filters.dateFrom) {
      params = params.set('fromDate', filters.dateFrom);
    }
    if (filters.dateTo) {
      params = params.set('toDate', filters.dateTo);
    }
    if (filters.amountFrom !== undefined) {
      params = params.set('initialAmountMin', filters.amountFrom.toString());
      params = params.set('finalAmountMin', filters.amountFrom.toString());
    }
    if (filters.amountTo !== undefined) {
      params = params.set('initialAmountMax', filters.amountTo.toString());
      params = params.set('finalAmountMax', filters.amountTo.toString());
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    
    
    return this.http.get<BackendPaymentPage>(this.baseUrl, { params })
      .pipe(map(page => this.mapPaymentPage(page)));
  }

  public getPaymentById(id: number): Observable<Payment> {
    return this.http.get<BackendPayment>(`${this.baseUrl}/${id}`)
      .pipe(map(payment => this.mapPayment(payment)));
  }

  /**
   * Maps backend payment response to frontend Payment model
   */
  private mapPayment(backendPayment: BackendPayment): Payment {
    const timestamp = new Date(backendPayment.createdAt);
    
    return {
      id: this.generateId(backendPayment.orderNumber),
      date: this.formatDateString(timestamp),
      timestamp: backendPayment.createdAt,
      orderNumber: backendPayment.orderNumber,
      payerName: this.accountCache[backendPayment.fromAccountNumber] || '', // Will be populated from cache
      recipientName: backendPayment.recipientName,
      payerAccountNumber: backendPayment.fromAccountNumber,
      recipientAccountNumber: backendPayment.toAccountNumber,
      currency: backendPayment.fromCurrency,
      amount: backendPayment.finalAmount,
      initialAmount: backendPayment.initialAmount,
      finalAmount: backendPayment.finalAmount,
      fee: backendPayment.initialAmount - backendPayment.finalAmount,
      status: this.mapStatus(backendPayment.status),
      type: 'DOMESTIC', // Default to DOMESTIC, adjust based on your logic
      purpose: backendPayment.paymentPurpose,
      referenceNumber: backendPayment.referenceNumber || undefined,
      paymentCode: backendPayment.paymentCode
    };
  }

  /**
   * Maps backend payment page to frontend Payment page
   */
  private mapPaymentPage(backendPage: BackendPaymentPage): PaymentPage {
    return {
      content: backendPage.content.map(payment => this.mapPayment(payment)),
      totalElements: backendPage.totalElements,
      totalPages: backendPage.totalPages,
      number: backendPage.number,
      size: backendPage.size
    };
  }

  /**
   * Maps backend status to frontend PaymentStatus
   */
  private mapStatus(backendStatus: string): PaymentStatus {
    switch (backendStatus.toUpperCase()) {
      case 'COMPLETED':
        return 'REALIZED';
      case 'DENIED':
      case 'REJECTED':
        return 'REJECTED';
      case 'PROCESSING':
      case 'PENDING':
        return 'PROCESSING';
      default:
        return 'PROCESSING';
    }
  }

  /**
   * Extracts date part in YYYY-MM-DD format
   */
  private formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Generates unique ID from order number (hash-like)
   */
  private generateId(orderNumber: string): number {
    let hash = 0;
    for (let i = 0; i < orderNumber.length; i++) {
      const char = orderNumber.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}