import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { delay } from 'rxjs/operators';
import * as jwt_decode from 'jwt-decode';
import * as moment from 'moment';

import { environment } from '../../../environments/environment';
import { of, EMPTY, BehaviorSubject } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, map, throwError, catchError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class GlobalService {
    private _headers: HttpHeaders | { [header: string]: string | string[]; } | undefined;
    private invalidEmails: string[] = [];

    constructor(private http: HttpClient,
        @Inject('LOCALSTORAGE') private localStorage: Storage,
        private router: Router
    ) {
    }

    private userNameSubject = new BehaviorSubject<string>(this.getCurrentUser()?.fullName || '');
    public userName$ = this.userNameSubject.asObservable();

    public updateCurrentUserFullName(newFullName: string): void {
        const userString = this.localStorage.getItem('currentUser');

        if (!userString) {
            console.error('Usuário não encontrado no localStorage.');
            return;
        }

        try {
            const user = JSON.parse(userString);
            user.fullName = newFullName;

            this.localStorage.setItem('currentUser', JSON.stringify(user));
            this.userNameSubject.next(newFullName); // Notifica os assinantes

            console.log('Nome atualizado no localStorage:', newFullName);
        } catch (error) {
            console.error('Erro ao atualizar o usuário no localStorage:', error);
        }
    }

    public getDonationCategories(): Array<{ value: string; label: string }> {
        return [
            { value: 'all', label: 'Outros' },
            { value: 'animals-pets', label: 'Animais / Pets' },
            { value: 'art-entertainment', label: 'Arte / Entretenimento' },
            { value: 'home-dwelling', label: 'Casa / Moradia' },
            { value: 'education-learning', label: 'Educação / Aprendizagem' },
            { value: 'entrepreneurship-companies', label: 'Empreendedorismo / Empresas' },
            { value: 'sports-athletes', label: 'Esportes / Atletas' },
            { value: 'events-celebrations', label: 'Eventos / Comemorações' },
            { value: 'hungry-malnutrition', label: 'Fome / Desnutrição' },
            { value: 'social-projects-volunteering', label: 'Projetos Sociais / Voluntariado' },
            { value: 'health-treatments', label: 'Saúde / Tratamentos' },
            { value: 'dreams-others', label: 'Sonhos / Outros' },
            { value: 'tragedies-disasters-accidents', label: 'Tragédias / Desastres / Acidentes' },
            { value: 'travels-tourism', label: 'Viagens / Turismo' },
        ];
    }

    public getCurrentUser(): any {
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

    public donationCreate(formData: FormData): Observable<any> {
        const user = this.getCurrentUser();
        formData.append('id_user', user.id);

        const headers = {
            Authorization: `Bearer ${user.token}`
        };

        return this.http.post<any>(
            `${environment.urlBase}${environment.link_donation_creat}`,
            formData,
            { headers }
        ).pipe(
            map((res) => res),
            catchError((e) => {
                console.error('Erro ao criar doação:', e);
                return throwError(() =>
                    e.error.message || 'Erro ao criar a doação. Tente novamente.'
                );
            })
        );
    }


    public donationCreate1(payload: {
        id_user: string,
        name: string,
        valor: number,
        texto: string,
        area: string,
        img: string
    }): Observable<any> {
        console.log("start creat new donation");
        let user = this.getCurrentUser();
        console.log(user);
        payload.id_user = user.id;
        console.log(payload);

        const body = payload;

        const headers = {
            'Content-Type': "application/json",
            'Authorization': user.token
        };

        return this.http.post<any>(`${environment.urlBase}${environment.link_donation_creat}`, body, { headers }).pipe(
            map((res) => {
                console.log("resposta creat login of user");
                console.log(res);

                //return this.router.navigate(['auth/valid-email']);	
                return res;

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

    public changePassword(oldPassword: string, newPassword: string): Observable<any> {
        const user = this.getCurrentUser();
        if (!user || !user.token) {
            return throwError(() => 'Usuário não autenticado ou token inválido');
        }

        const body = {
            old_password: oldPassword,
            new_password: newPassword
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        };

        return this.http.post<any>(`${environment.urlBase}/users/passwordChange`, body, { headers }).pipe(
            map((res) => {
                console.log('Resposta da alteração de senha:', res);
                return res;
            }),
            catchError((e) => {
                console.error('Erro ao alterar senha:', e);
                if (e.error.message) return throwError(() => e.error.message);
                return throwError(
                    () => 'Não foi possível alterar a senha. Tente novamente mais tarde!'
                );
            })
        );
    }

    public saveBankAccount(payload: {
        banco: string,
        banco_nome: string,
        conta: string,
        agencia: string,
        digito: string,
        cpf: string,
        telefone: string,
        pix: string
    }): Observable<any> {
        const user = this.getCurrentUser();
        if (!user || !user.token) {
            return throwError(() => 'Usuário não autenticado ou token inválido');
        }

        const body = payload;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        };

        return this.http.post<any>(`${environment.urlBase}/users/bankAccount`, body, { headers }).pipe(
            map((res) => {
                console.log('Resposta do salvamento de dados bancários:', res);
                return res;
            }),
            catchError((e) => {
                console.error('Erro ao salvar dados bancários:', e);
                if (e.error.message) return throwError(() => e.error.message);
                return throwError(
                    () => 'Não foi possível salvar os dados bancários. Tente novamente mais tarde!'
                );
            })
        );
    }

    public changerBankAccount(payload: {
        banco: string,
        banco_nome: string,
        conta: string,
        agencia: string,
        digito: string,
        cpf: string,
        telefone: string,
        pix: string,
        id_conta_old: string
    }): Observable<any> {
        const user = this.getCurrentUser();
        if (!user || !user.token) {
            return throwError(() => 'Usuário não autenticado ou token inválido');
        }

        const body = payload;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        };

        return this.http.patch<any>(`${environment.urlBase}/users/bankAccount`, body, { headers }).pipe(
            map((res) => {
                console.log('Resposta do salvamento de dados bancários:', res);
                return res;
            }),
            catchError((e) => {
                console.error('Erro ao salvar dados bancários:', e);
                if (e.error.message) return throwError(() => e.error.message);
                return throwError(
                    () => 'Não foi possível salvar os dados bancários. Tente novamente mais tarde!'
                );
            })
        );
    }

    public getBankAccount(): Observable<any | null> {
        const user = this.getCurrentUser();
        if (!user || !user.token || !user.id) {
            return throwError(() => 'Usuário não autenticado ou token inválido');
        }

        const headers = {
            'Authorization': `Bearer ${user.token}`
        };

        const url = `${environment.urlBase}/users/bankAccount?id_user=${user.id}`;

        return this.http.get<any>(url, { headers }).pipe(
            map((res) => {
                console.log('Resposta da busca de dados bancários:', res);
                return res;
            }),
            catchError((e) => {
                console.error('Erro ao buscar dados bancários:', e);

                // Verifica se é um 404 com a mensagem específica
                if (e.status === 404 && e.error.message === 'Nenhuma conta ativa encontrada para este usuário') {
                    return of(null); // Retorna null como Observable
                }

                // Outros erros continuam sendo lançados
                if (e.error.message) {
                    return throwError(() => e.error.message);
                }
                return throwError(
                    () => 'Não foi possível buscar os dados bancários. Tente novamente mais tarde!'
                );
            })
        );
    }

    public getDonationList(page: number = 1, limit: number = 10): Observable<{
        has_next_page: boolean,
        items: Array<{
            active: boolean,
            area: string,
            date_create: string,
            date_start: string,
            dell: boolean,
            id: string,
            img: string,
            name: string,
            texto: string,
            valor: number
        }>,
        limit: number,
        page: number,
        total: number
    }> {
        const user = this.getCurrentUser();
        if (!user || !user.token || !user.id) {
            return throwError(() => 'Usuário não autenticado ou token inválido');
        }

        const headers = {
            'Authorization': `Bearer ${user.token}`
        };

        const url = `${environment.urlBase}/donation/list?id_user=${user.id}&page=${page}&limit=${limit}`;

        return this.http.get<any>(url, { headers }).pipe(
            map((res) => {
                console.log('Resposta da busca de doações:', res);
                return res;
            }),
            catchError((e) => {
                console.error('Erro ao buscar lista de doações:', e);
                if (e.error.message) return throwError(() => e.error.message);
                return throwError(
                    () => 'Não foi possível buscar a lista de doações. Tente novamente mais tarde!'
                );
            })
        );
    }

    public getDonationByLink(nomeLink: string): Observable<{
        active: boolean,
        area: string,
        date_create: string,
        date_start: string,
        dell: boolean,
        id: string,
        id_user: string,
        img_caminho: string,
        name: string,
        nome_link: string,
        texto: string,
        valor: number
    }> {
        /*const user = this.getCurrentUser();
        if (!user || !user.token) {
            return throwError(() => 'Usuário não autenticado ou token inválido');
        }

        const headers = {
            'Authorization': `Bearer ${user.token}`
        };*/
        const headers = {
            'Authorization': `Bearer `
        }

        const url = `${environment.urlBase}/donation/link/${nomeLink}`;
        console.log(url)

        return this.http.get<any>(url, { headers }).pipe(
            map((res) => {
                console.log('Resposta da busca de doação:', res);
                return res;
            }),
            catchError((e) => {
                console.error('Erro ao buscar doação:', e);
                if (e.error.message) return throwError(() => e.error.message);
                return throwError(
                    () => 'Não foi possível buscar a doação. Tente novamente mais tarde!'
                );
            })
        );
    }

    public pixQrCodeCreate(payload: {
        id: string;
        valor: string;
        cpf: string;
        nome: string;
        chave: string;
        mensagem: string;
        anonimo: boolean;
    }): Observable<any> {
        const headers = {
            'Content-Type': 'application/json'
        };

        const cpfNumerico = payload.cpf.replace(/\D/g, '');
        payload.cpf = cpfNumerico;

        return this.http.post<any>(`${environment.urlBase}/pix/create`, payload, { headers }).pipe(
            map((res) => {
                console.log('QR Code Pix criado:', res);
                return res;
            }),
            catchError((e) => {
                console.error('Erro ao criar QR Code Pix:', e);
                return throwError(
                    () => 'Não foi possível gerar o QR Code Pix. Tente novamente mais tarde!'
                );
            })
        );
    }

    public getDonationMensagens(id: string): Observable<Array<{
        id: string;
        valor: string;
        cpf: string;
        nome: string;
        mensagem: string;
        anonimo: boolean;
        data_criacao: string;
    }>> {
        const headers = {
            'Content-Type': 'application/json'
        };

        const url = `${environment.urlBase}/donation/mensagem?id=${id}`;

        return this.http.get<any[]>(url, { headers }).pipe(
            map((res) => {
                console.log('Mensagens da doação recebidas:', res);
                return res;
            }),
            catchError((e) => {
                console.error('Erro ao buscar mensagens da doação:', e);
                return throwError(() =>
                    'Não foi possível carregar as mensagens da doação. Tente novamente mais tarde!'
                );
            })
        );
    }

    public getPixTotais(id: string): Observable<{ valor_total: string; total_doadores: number }> {
        const headers = {
            'Content-Type': 'application/json'
        };

        const url = `${environment.urlBase}/pix/total/${id}`;

        return this.http.get<{ valor_total: string; total_doadores: number }>(url, { headers }).pipe(
            map((res) => {
                console.log('Totais Pix recebidos:', res);
                return res;
            }),
            catchError((e) => {
                console.error('Erro ao buscar totais Pix:', e);
                return throwError(() =>
                    'Não foi possível obter o total arrecadado. Tente novamente mais tarde!'
                );
            })
        );
    }

    public getUserProfileImage(userId: string): Observable<string | null> {
        const headers = {
            'Content-Type': 'application/json'
        };

        const url = `${environment.urlBase}/users/ProfileImage/${userId}`;

        return this.http.get<{ image_url: string }>(url, { headers }).pipe(
            map(res => res.image_url),
            catchError((e) => {
                if (e.status === 404) {
                    // Imagem não encontrada
                    return of(null);
                }

                console.error('Erro ao buscar imagem de perfil:', e);
                return throwError(() =>
                    'Não foi possível carregar a imagem de perfil. Tente novamente mais tarde.'
                );
            })
        );
    }

    public uploadUserProfileImage(formData: FormData, headers: { [key: string]: string }): Observable<any> {
        return this.http.post(`${environment.urlBase}/users/uploadProfileImage`, formData, { headers }).pipe(
            map((res) => res),
            catchError((err) => {
                console.error('Erro ao enviar imagem:', err);
                return throwError(() => 'Erro ao enviar imagem de perfil.');
            })
        );
    }

    public deleteDonationById(id: string): Observable<any> {
        const user = this.getCurrentUser();
        const headers = {
            Authorization: `Bearer ${user.token}`
        };

        return this.http.delete(`${environment.urlBase}/donation/${id}`, { headers }).pipe(
            map((res) => {
                console.log('Doação encerrada:', res);
                return res;
            }),
            catchError((e) => {
                console.error('Erro ao encerrar doação:', e);
                return throwError(() =>
                    e.error?.message || 'Erro ao encerrar a campanha. Tente novamente.'
                );
            })
        );
    }

    public donationClosed(id: string): Observable<any> {
        const user = this.getCurrentUser();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        };

        const url = `${environment.urlBase}/donation/closed/${id}`;

        return this.http.get<any>(url, { headers }).pipe(
            map((res) => {
                console.log('Doação encerrada com sucesso:', res);
                return res;
            }),
            catchError((err) => {
                console.error('Erro ao encerrar doação:', err);
                return throwError(() =>
                    err?.error?.message || 'Erro ao encerrar a doação. Tente novamente mais tarde.'
                );
            })
        );
    }

    public solicitarPagamento(id: string): Observable<any> {
        const user = this.getCurrentUser();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        };

        const url = `${environment.urlBase}/donation/rescue/${id}`;

        return this.http.get<any>(url, { headers }).pipe(
            map((res) => {
                console.log('Solicitação de pagamento feita com sucesso:', res);
                return res;
            }),
            catchError((err) => {
                console.error('Erro ao solicitar pagamento:', err);
                return throwError(() =>
                    err?.error?.message || 'Erro ao solicitar o pagamento. Tente novamente.'
                );
            })
        );
    }

    public sendDonationVisualization(payload: {
        id_doacao: string;
        id_user: string;
        visuaization: boolean;
        donation_like: boolean;
        love: boolean;
        shared: boolean;
        acesse_donation: boolean;
        create_pix: boolean;
        create_cartao: boolean;
        create_paypal: boolean;
        create_google: boolean;
        create_pag1: boolean;
        create_pag2: boolean;
        create_pag3: boolean;
        idioma: string;
        tema: string;
        form: string;
        google: string;
        google_maps: string;
        google_ads: string;
        meta_pixel: string;
        Cookies_Stripe: string;
        Cookies_PayPal: string;
        visitor_info1_live: string;
    }): Observable<any> {
        const headers = {
            'Content-Type': 'application/json'
        };

        let getCurrentUser = this.getCurrentUser();
        payload.id_user = getCurrentUser == null ? '1dbf20a8-01cd-4508-9d14-c4f20ee22f2c' : getCurrentUser.id_user

        return this.http.post<any>(
            `${environment.urlBase}/donation/visualization`,
            payload,
            { headers }
        ).pipe(
            map(res => {
                console.log('Visualização registrada:', res);
                return res;
            }),
            catchError(err => {
                console.error('Erro ao registrar visualização:', err);
                return throwError(() =>
                    err?.error?.message || 'Erro ao registrar a visualização.'
                );
            })
        );
    }

    public getUserById(userId: string): Observable<any> {
        return this.http.get<any>(`${environment.urlBase}/users/show/${userId}`).pipe(
            map((res) => {
                console.log('Dados do usuário:', res);
                return res;
            }),
            catchError((e) => {
                console.error('Erro ao buscar usuário por ID:', e);
                return throwError(() =>
                    e.error?.message || 'Não foi possível carregar os dados do usuário. Tente novamente mais tarde.'
                );
            })
        );
    }

    public changeUserName(payload: {
        id_user: string;
        old_name: string;
        new_name: string;
    }): Observable<any> {
        const user = this.getCurrentUser();

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
        });

        return this.http.post<any>(
            `${environment.urlBase}/users/nameChange`,
            payload,
            { headers }
        ).pipe(
            map(response => response),
            map((response) => {
                console.log('Dados do usuário:', response);
                this.updateCurrentUserFullName(payload.new_name);
                return response;
            }),
            catchError(error => {
                console.error('Erro ao alterar nome do usuário:', error);
                return throwError(() => error.error?.message || 'Erro ao alterar nome.');
            })
        );
    }

    public createUserAndDonation(formData: FormData): Observable<any> {
        return this.http.post<any>(
            `${environment.urlBase}/donation/createUserAndDonation`,
            formData
        ).pipe(
            map((res) => res),
            catchError((e) => {
                console.error('Erro ao criar usuário e doação:', e);
                if (e.error == "Email já cadastrado\n") {
                    let erroEmail = { message: "Erro Email já cadastrado" };
                    return throwError(() => erroEmail);
                }
                return throwError(() =>
                    e.error?.message || 'Erro ao criar usuário e doação. Tente novamente mais tarde.'
                );
            })
        );
    }

    public addInvalidEmail(email: string): void {
        if (!this.invalidEmails.includes(email)) {
            this.invalidEmails.push(email);
        }
    }

   public isEmailInvalid(email: string): boolean {
        return this.invalidEmails.includes(email);
    }

    public getInvalidEmails(): string[] {
        return this.invalidEmails;
    }

    public sendContactMessage(payload: {
        nome: string;
        email: string;
        mensagem: string;
        ip: string;
        location: string;
        token: string;
    }): Observable<any> {
        const headers = { 'Content-Type': 'application/json' };

        return this.http.post<any>(`${environment.urlBase}/contact/mensagem`, payload, { headers }).pipe(
            map((res) => {
                console.log('Contato enviado com sucesso:', res);
                return res;
            }),
            catchError((e) => {
                console.error('Erro ao enviar contato:', e);
                return throwError(() => 'Erro ao enviar mensagem de contato.');
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


