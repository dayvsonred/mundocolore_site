import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { delay } from 'rxjs/operators';
import * as jwt_decode from 'jwt-decode';
import * as moment from 'moment';

import { environment } from '../../../environments/environment';
import { of, EMPTY } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, map, throwError, catchError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthenticationService {
    private _headers: HttpHeaders | { [header: string]: string | string[]; } | undefined;

    constructor(private http: HttpClient,
        @Inject('LOCALSTORAGE') private localStorage: Storage,
        private router: Router
    ) {
    }

    login(email: string, password: string) {
        return of(true)
            .pipe(delay(1000),
                map((/*response*/) => {
                    // set token property
                    // const decodedToken = jwt_decode(response['token']);

                    // store email and jwt token in local storage to keep user logged in between page refreshes
                    this.localStorage.setItem('currentUser', JSON.stringify({
                        token: 'aisdnaksjdn,axmnczm',
                        isAdmin: true,
                        email: 'john.doe@gmail.com',
                        id: '12312323232',
                        alias: 'john.doe@gmail.com'.split('@')[0],
                        expiration: moment().add(1, 'days').toDate(),
                        fullName: 'John Doe'
                    }));

                    return true;
                }));
    }

    logout(): void {
        // clear token remove user from local storage to log user out
        this.localStorage.removeItem('currentUser');
    }

    getCurrentUser(): any {
        const userString = this.localStorage.getItem('currentUser');

        if (!userString) {
            return null;
        }

        try {
            const user = JSON.parse(userString);
            return user;
        } catch (error) {
            console.error('Erro ao parsear o usuário do localStorage:', error);
            return null;
        }
    }

        passwordResetRequest(email: string) {
        const body = { email };
        let headers = new HttpHeaders().set('Content-Type', 'application/json');
        const token = this.localStorage.getItem('token');

        if (token) {
            headers = headers.set('Authorization', token);
        }

        return this.http.post<{ message: string }>(`${environment.urlBase}/users/passwordRecover`, body, { headers }).pipe(
            catchError((e) => {
                if (e.error?.message) return throwError(() => e.error.message);

                return throwError(() => 'Nao foi possivel enviar o link de recuperacao.');
            })
        );
    }

    changePassword(email: string, currentPwd: string, newPwd: string) {
        return of(true).pipe(delay(1000));
    }

    passwordReset(email: string, token: string, password: string, confirmPassword: string): any {
        const body = {
            email,
            token,
            senha: password
        };

        const headers = new HttpHeaders().set('Content-Type', 'application/json');

        return this.http.post<any>(`${environment.urlBase}/users/passwordConfirmToken`, body, { headers }).pipe(
            catchError((e) => {
                if (e.error?.message) return throwError(() => e.error.message);
                if (typeof e.error === 'string') return throwError(() => e.error);

                return throwError(() => 'Não foi possível alterar a senha. Tente novamente mais tarde.');
            })
        );
    }


    public isAuthenticated(): boolean {
        const token = localStorage.getItem('access_token');

        if (!token) return false;

        const jwtHelper = new JwtHelperService();
        return !jwtHelper.isTokenExpired(token);
    }

    public sign(payload: { email: string; password: string }): Observable<any> {
        console.log("1 send login to service");
        this._headers = {
            'Authorization': "Basic QVBJX05BTUVfQUNDRVNTOkFQSV9TRUNSRVRfQUNDRVNT",
            "Content-Type": "application/x-www-form-urlencoded",
        };
        const Params = new URLSearchParams();
        Params.set('grant_type', 'password');
        Params.set('username', payload.email);
        Params.set('password', payload.password);
        console.log(" 2 send login to service");


        let options = {
            headers: new HttpHeaders()
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .set('Authorization', "Basic QVBJX05BTUVfQUNDRVNTOkFQSV9TRUNSRVRfQUNDRVNT")
        };


        return this.http.post<any>(`${environment.urlBase}${environment.login}`, Params.toString(), options).pipe(
            map((res) => {
                console.log("resposta post login >>>>>>>>");
                console.log(res);
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                localStorage.setItem('access_token', res.token);
                localStorage.setItem('token', res.token);

                let conta_nivel = false;
                let conta_nivel_ativo = null;
                let conta_nivel_data_update = null;
                let conta_nivel_data_nivel = null;
                let conta_nivel_data_status = null;
                let conta_nivel_data_tipo_pagamento = null;
                if(res.conta_nivel != null){
                    conta_nivel_ativo = res.conta_nivel.ativo;
                    conta_nivel_data_update = res.conta_nivel.data_update;
                    conta_nivel_data_nivel = res.conta_nivel.nivel;
                    conta_nivel_data_status = res.conta_nivel.status;
                    conta_nivel_data_tipo_pagamento = res.conta_nivel.tipo_pagamento;
                }


                this.localStorage.setItem('currentUser', JSON.stringify({
                    token: res.token,
                    isAdmin: false,
                    email: res.user.email,
                    id: res.user.id,
                    id_user: res.user.id,
                    alias: res.user.email.split('@')[0],
                    expiration: moment().add(1, 'days').toDate(),
                    fullName: res.user.name,
                    conta_nivel_ativo : res.conta_nivel.ativo,
                    conta_nivel_data_update : res.conta_nivel.data_update,
                    conta_nivel_data_nivel : res.conta_nivel.nivel,
                    conta_nivel_data_status : res.conta_nivel.status,
                    conta_nivel_data_tipo_pagamento : res.conta_nivel.tipo_pagamento
                }));

                //return this.router.navigate(['dashboard']);
                return true
            }),
            catchError((e) => {
                if (e.error.message) return throwError(() => e.error.message);

                return throwError(
                    () =>
                        'No momento não estamos conseguindo validar este dados, tente novamente mais tarde!'
                );
            })
        );
    }


    public signerror(payload: { email: string; password: string }) {
        console.log("send login to service")
        const headersOld = {
            'Authorization': "Basic QVBJX05BTUVfQUNDRVNTOkFQSV9TRUNSRVRfQUNDRVNT",
            "Content-Type": "application/x-www-form-urlencoded",
        };
        /*
        const headers: HttpHeaders({ 
            'Authorization': "Basic QVBJX05BTUVfQUNDRVNTOkFQSV9TRUNSRVRfQUNDRVNT",
            'Content-Type': "application/x-www-form-urlencoded" })
            */

        /*const requestOptions = {                                                                                                                                                                                 
            headers: new HttpHeaders(headersSend), 
          };*/

        const iheaders = new HttpHeaders();
        iheaders.append('Content-Type', 'application/x-www-form-urlencoded')
        iheaders.append('Authorization', "Basic QVBJX05BTUVfQUNDRVNTOkFQSV9TRUNSRVRfQUNDRVNT")

        /*
    let options = {
        headers: new HttpHeaders({ 
            'Authorization': "Basic QVBJX05BTUVfQUNDRVNTOkFQSV9TRUNSRVRfQUNDRVNT",
            'Content-Type': "application/x-www-form-urlencoded" })
    }  */

        const Params = new URLSearchParams();
        Params.set('grant_type', 'password');
        Params.set('username', payload.email);
        Params.set('password', payload.password);

        let options = {
            headers: new HttpHeaders()
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .set('Authorization', 'Basic QVBJX05BTUVfQUNDRVNTOkFQSV9TRUNSRVRfQUNDRVNT')
        };

        const headers = {
            'Authorization': "Basic QVBJX05BTUVfQUNDRVNTOkFQSV9TRUNSRVRfQUNDRVNT",
            "Content-Type": "application/x-www-form-urlencoded",
        };

        this.http.post<{
            access_token: string,
            expires_in: string,
            jti: string,
            token_type: string
        }>(`${environment.urlBase}${environment.authorization}`, Params.toString(), { headers }).subscribe(
            (res) => {
                console.log(res)
                // localStorage.removeItem('access_token');
                // localStorage.removeItem('token');
                // localStorage.setItem('access_token', res.access_token);
                // localStorage.setItem('token', res.access_token);


                // this.localStorage.setItem('currentUser', JSON.stringify({
                //     token: res.access_token,
                //     isAdmin: true,
                //     email: payload.email,
                //     id: '12312323232',
                //     alias: payload.email.split('@')[0],
                //     expiration: moment().add(1, 'days').toDate(),
                //     fullName: 'Dayvson'
                // }));

                //return this.router.navigate(['dashboard']);
                return true;
            }
            //   () => {
            //     return 'No momento não estamos conseguindo validar este dados, tente novamente mais tarde!';
            //   }

        );

        // return this.http.post<{
        //      access_token: string, 
        //      expires_in: string, 
        //      jti: string, 
        //      token_type: string 
        //     }>(`${environment.urlBase}${environment.authorization}`, Params.toString(), options ).pipe( map((res) => {
        //         console.log(res)
        // 		// localStorage.removeItem('access_token');
        // 		// localStorage.removeItem('token');
        // 		// localStorage.setItem('access_token', res.access_token);
        // 		// localStorage.setItem('token', res.access_token);


        //         // this.localStorage.setItem('currentUser', JSON.stringify({
        //         //     token: res.access_token,
        //         //     isAdmin: true,
        //         //     email: payload.email,
        //         //     id: '12312323232',
        //         //     alias: payload.email.split('@')[0],
        //         //     expiration: moment().add(1, 'days').toDate(),
        //         //     fullName: 'Dayvson'
        //         // }));

        // 		//return this.router.navigate(['dashboard']);
        //         return true;
        // 	}),
        // 	catchError((e) => {
        // 		if (e.error.message) return throwError(() => e.error.message);

        // 		return throwError(
        // 			() =>
        // 				'No momento não estamos conseguindo validar este dados, tente novamente mais tarde!'
        // 		);
        // 	})
        // );
    }

    // this.http.post<{
    //     access_token: string, 
    //     expires_in: string, 
    //     jti: string, 
    //     token_type: string 
    //    }>(`${environment.urlBase}${environment.authorization}`, Params.toString(),  {
    //        headers: new HttpHeaders()
    //          .set('Content-Type', 'application/x-www-form-urlencoded')
    //          .set('Authorization', "Basic QVBJX05BTUVfQUNDRVNTOkFQSV9TRUNSRVRfQUNDRVNT")
    //      }).pipe( map((res) => {

    public createNewUserLongin(payload: {
        email: string,
        name: string,
        password: string,
        cpf: string,
        offshoot: string,
        longitude: string,
        latitude: string
    }): Observable<any> {
        console.log("start creat login of user");
        console.log(payload);
        const body = payload;

        const headers = {
            'Content-Type': "application/json",
        };

        return this.http.post<any>(`${environment.urlBase}${environment.link_creat_login}`, body, { headers }).pipe(
            map((res) => {
                console.log("res creat login of user");
                console.log(res);

                return this.router.navigate(['auth/valid-email']);

            }),
            catchError((e) => {
                if (e.error.message) return throwError(() => e.error.message);
                return throwError(
                    () =>
                        'No momento não estamos conseguindo validar este dados, tente novamente mais tarde!'
                );
            })
        );
    }

    public validEmailUser(payload: {
        email: any,
        user: any,
    }): Observable<any> {
        console.log("valid user");
        console.log(payload);
        const body = payload;

        const headers = {
            'Content-Type': "application/json",
        };

        return this.http.get<any>(`${environment.urlBase}${environment.link_creat_valid_email}/${payload.email}/${payload.user}`, { headers }).pipe(
            map((res) => {
                console.log("res valid user");
                console.log(res);

                //return this.router.navigate(['new/user/valid/email']);	
                return null;
            }),
            catchError((e) => {
                if (e.error.message) return throwError(() => e.error.message);
                return throwError(
                    () =>
                        'No momento não estamos conseguindo validar este dados, tente novamente mais tarde!'
                );
            })
        );
    }

    public confirmEmail(email: string, token: string): Observable<any> {
        const params = new HttpParams()
            .set('email', email)
            .set('token', token);

        return this.http.get<any>(`${environment.urlBase}/users/confirmEmail`, { params }).pipe(
            map((res) => res),
            catchError((e) => {
                if (e.error?.message) return throwError(() => e.error.message);
                if (typeof e.error === 'string') return throwError(() => e.error);
                return throwError(() => 'Erro ao validar email. Entre em contato com os administradores.');
            })
        );
    }

    public sendPageVisualization(payload: {
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
            user: payload.user || (currentUser?.fullName || 'Visitor')
        };

        return this.http.post<any>(
            `https://rm0t2sapef.execute-api.us-east-1.amazonaws.com/contact/visualizations`,
            body,
            { headers }
        ).pipe(
            map((res) => {
                console.log('Visualizacao de pagina registrada:', res);
                return res;
            }),
            catchError((e) => {
                console.error('Erro ao registrar visualizacao de pagina:', e);
                return throwError(() => 'Erro ao registrar visualizacao de pagina.');
            })
        );
    }

    private getDeviceType(): string {
        if (typeof navigator === 'undefined') return 'desktop';
        const ua = navigator.userAgent || '';
        if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) return 'mobile';
        return 'desktop';
    }
}




