import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { AuthenticationService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface Address {
  id: string;
  user_id: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthenticationService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/addresses`, { headers: this.getHeaders() }).pipe(
      catchError(error => throwError(error))
    );
  }

  createAddress(address: Omit<Address, 'id' | 'user_id'>): Observable<Address> {
    return this.http.post<Address>(`${this.apiUrl}/addresses`, address, { headers: this.getHeaders() }).pipe(
      catchError(error => throwError(error))
    );
  }
}