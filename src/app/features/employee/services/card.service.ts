import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Card } from '../models/card.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private apiUrl = `${environment.apiUrl}/api/cards`;

  constructor(private http: HttpClient) {}

  getCards(clientId: number): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.apiUrl}/client/${clientId}`);
  }

  getCardsByAccountNumber(accountNumber: string): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.apiUrl}/account/${accountNumber}`);
  }

  blockCard(cardNumber: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${cardNumber}/block`, {});
  }

  unblockCard(cardNumber: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${cardNumber}/unblock`, {});
  }

  deactivateCard(cardNumber: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${cardNumber}/deactivate`, {});
  }
}
