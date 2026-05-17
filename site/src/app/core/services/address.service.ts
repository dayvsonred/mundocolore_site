import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { AuthenticationService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface Address {
  id: string;
  user_id: string;
  observation: string;
  complement: string;
  number: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  is_default: boolean;
}

export interface AddressPayload {
  observation: string;
  complement: string;
  number: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  is_default: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);
  }

  getAddresses(): Observable<Address[]> {
    return this.http
      .get<Address[]>(`${this.apiUrl}/addresses`, { headers: this.getHeaders() })
      .pipe(catchError((error) => throwError(() => error)));
  }

  createAddress(payload: AddressPayload): Observable<Address> {
    return this.http
      .post<Address>(`${this.apiUrl}/addresses`, payload, { headers: this.getHeaders() })
      .pipe(catchError((error) => throwError(() => error)));
  }

  updateAddress(id: string, payload: AddressPayload): Observable<Address> {
    return this.http
      .put<Address>(
        `${this.apiUrl}/addresses`,
        {
          id,
          ...payload
        },
        { headers: this.getHeaders() }
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  deleteAddress(id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http
      .request<{ deleted: boolean; id: string }>('DELETE', `${this.apiUrl}/addresses`, {
        headers: this.getHeaders(),
        body: { id }
      })
      .pipe(catchError((error) => throwError(() => error)));
  }
}
