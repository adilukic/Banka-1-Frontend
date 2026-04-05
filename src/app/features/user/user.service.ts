import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { User } from './components/user-create/user-create.component';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}/clients/customers`;

  constructor(private http: HttpClient) {}

  createUser(user: User): Observable<any> {
    return this.http.post<any>(this.baseUrl, user);
  }
}
