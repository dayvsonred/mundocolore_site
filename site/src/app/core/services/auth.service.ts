import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private readonly apiUrl = environment.apiUrl;
  private readonly basicAuthHeader = 'Basic QVBJX05BTUVfQUNDRVNTOkFQSV9TRUNSRVRfQUNDRVNT';

  constructor(
    private http: HttpClient,
    @Inject('LOCALSTORAGE') private localStorage: Storage,
    private router: Router
  ) {}

  register(email: string, password: string, name: string): Observable<any> {
    const body = { email, password, name };
    return this.http.post<any>(`${this.apiUrl}/users/register`, body).pipe(
      map((response) => {
        this.localStorage.setItem('currentUser', JSON.stringify(response));
        return response;
      }),
      catchError((error) => throwError(() => error))
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.sign({ email, password }).pipe(map(() => this.getCurrentUser()));
  }

  sign(payload: { email: string; password: string }): Observable<boolean> {
    const params = new URLSearchParams();
    params.set('grant_type', 'password');
    params.set('username', payload.email);
    params.set('password', payload.password);

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Authorization', this.basicAuthHeader);

    return this.http
      .post<any>(`${environment.urlBase}${environment.login}`, params.toString(), { headers })
      .pipe(
        map((response) => {
          this.persistAuthenticatedUser(response, payload.email);
          return true;
        }),
        catchError((error) =>
          throwError(
            () =>
              error?.error?.message ||
              'No momento nao foi possivel validar estes dados. Tente novamente mais tarde.'
          )
        )
      );
  }

  getProfile(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => 'No token');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/users/profile`, { headers }).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  passwordResetRequest(email: string): Observable<{ message: string }> {
    const body = { email };
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    const token = this.localStorage.getItem('token');

    if (token) {
      headers = headers.set('Authorization', token);
    }

    return this.http
      .post<{ message: string }>(`${environment.urlBase}/users/passwordRecover`, body, { headers })
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              error?.error?.message ||
              'Nao foi possivel enviar o link de recuperacao.'
          )
        )
      );
  }

  changePassword(email: string, currentPwd: string, newPwd: string): Observable<any> {
    const body = { email, old_password: currentPwd, new_password: newPwd };
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    return this.http
      .post<any>(`${environment.urlBase}/users/passwordChange`, body, { headers })
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              error?.error?.message ||
              'Nao foi possivel alterar a senha. Tente novamente mais tarde.'
          )
        )
      );
  }

  passwordReset(
    email: string,
    token: string,
    password: string,
    confirmPassword: string
  ): Observable<any> {
    const body = {
      email,
      token,
      senha: password,
      confirmar_senha: confirmPassword
    };
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    return this.http
      .post<any>(`${environment.urlBase}/users/passwordConfirmToken`, body, { headers })
      .pipe(
        catchError((error) =>
          throwError(
            () =>
              error?.error?.message ||
              'Nao foi possivel alterar a senha. Tente novamente mais tarde.'
          )
        )
      );
  }

  createNewUserLongin(payload: {
    email: string;
    name: string;
    password: string;
    cpf: string;
    offshoot: string;
    longitude: string;
    latitude: string;
  }): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };
    return this.http
      .post<any>(`${environment.urlBase}${environment.link_creat_login}`, payload, { headers })
      .pipe(
        map((response) => response),
        catchError((error) =>
          throwError(
            () =>
              error?.error?.message ||
              'No momento nao foi possivel validar estes dados. Tente novamente mais tarde.'
          )
        )
      );
  }

  validEmailUser(payload: { email: string; user: string }): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };
    return this.http
      .get<any>(
        `${environment.urlBase}${environment.link_creat_valid_email}/${payload.email}/${payload.user}`,
        { headers }
      )
      .pipe(
        map((response) => response),
        catchError((error) =>
          throwError(
            () =>
              error?.error?.message ||
              'No momento nao foi possivel validar estes dados. Tente novamente mais tarde.'
          )
        )
      );
  }

  confirmEmail(email: string, token: string): Observable<any> {
    const params = new HttpParams().set('email', email).set('token', token);
    return this.http.get<any>(`${environment.urlBase}/users/confirmEmail`, { params }).pipe(
      map((response) => response),
      catchError((error) =>
        throwError(
          () =>
            error?.error?.message ||
            (typeof error?.error === 'string' ? error.error : 'Erro ao validar email.')
        )
      )
    );
  }

  sendPageVisualization(payload: {
    page: string;
    timestamp?: string;
    referrer?: string;
    device?: string;
    language?: string;
    ip?: string;
    user?: string;
  }): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };
    const currentUser = this.getCurrentUser();
    const body = {
      page: payload.page,
      timestamp: payload.timestamp || new Date().toISOString(),
      referrer: payload.referrer ?? (typeof document !== 'undefined' ? document.referrer : ''),
      device: payload.device || this.getDeviceType(),
      language: payload.language || (typeof navigator !== 'undefined' ? navigator.language : 'pt-BR'),
      ip: payload.ip || '',
      user: payload.user || currentUser?.fullName || 'Visitor'
    };

    return this.http
      .post<any>('https://rm0t2sapef.execute-api.us-east-1.amazonaws.com/contact/visualizations', body, {
        headers
      })
      .pipe(
        map((response) => response),
        catchError(() => throwError(() => 'Erro ao registrar visualizacao de pagina.'))
      );
  }

  logout(): void {
    this.localStorage.removeItem('currentUser');
    this.localStorage.removeItem('token');
    this.localStorage.removeItem('access_token');
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    const currentUser = this.getCurrentUser();
    return currentUser?.token || this.localStorage.getItem('token') || this.localStorage.getItem('access_token');
  }

  getCurrentUser(): any | null {
    const userString = this.localStorage.getItem('currentUser');
    if (!userString) {
      return null;
    }

    try {
      return JSON.parse(userString);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const jwtHelper = new JwtHelperService();
      return !jwtHelper.isTokenExpired(token);
    } catch {
      return false;
    }
  }

  private persistAuthenticatedUser(response: any, fallbackEmail: string): void {
    const token = response?.token || response?.access_token;
    if (!token) {
      throw new Error('Token nao encontrado na resposta de autenticacao.');
    }

    const userEmail = response?.user?.email || response?.email || fallbackEmail;
    const userId = response?.user?.id || response?.id || '';
    const userName = response?.user?.name || response?.name || '';
    const contaNivel = response?.conta_nivel ?? {};

    this.localStorage.removeItem('access_token');
    this.localStorage.removeItem('token');
    this.localStorage.removeItem('currentUser');
    this.localStorage.setItem('access_token', token);
    this.localStorage.setItem('token', token);
    this.localStorage.setItem(
      'currentUser',
      JSON.stringify({
        token,
        isAdmin: false,
        email: userEmail,
        id: userId,
        id_user: userId,
        alias: userEmail.includes('@') ? userEmail.split('@')[0] : userEmail,
        expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        fullName: userName,
        conta_nivel_ativo: contaNivel.ativo ?? null,
        conta_nivel_data_update: contaNivel.data_update ?? null,
        conta_nivel_data_nivel: contaNivel.nivel ?? null,
        conta_nivel_data_status: contaNivel.status ?? null,
        conta_nivel_data_tipo_pagamento: contaNivel.tipo_pagamento ?? null
      })
    );
  }

  private getDeviceType(): string {
    if (typeof navigator === 'undefined') {
      return 'desktop';
    }

    const ua = navigator.userAgent || '';
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }
}
