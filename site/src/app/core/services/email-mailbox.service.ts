import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthenticationService } from './auth.service';

export interface MailboxEmail {
  id: string;
  type: string;
  direction: string;
  mailbox: string;
  received_at: string;
  from_email: string;
  to_email: string;
  recipients?: string[];
  subject: string;
  status: 'read' | 'unread' | string;
  raw_size: number;
}

export interface EmailAttachment {
  filename: string;
  content_type: string;
  size: number;
}

export interface MailboxEmailDetail extends MailboxEmail {
  from_name?: string;
  body_text?: string;
  body_html?: string;
  attachments?: EmailAttachment[];
}

export interface MailboxEmailList {
  items: MailboxEmail[];
  next_cursor?: string;
}

export interface ComposeEmailPayload {
  from_email: string;
  to_email: string;
  to_name?: string;
  subject: string;
  body: string;
}

@Injectable({ providedIn: 'root' })
export class EmailMailboxService {
  private readonly endpoint = `${environment.apiUrl}/emails`;

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {}

  getMailboxes(): Observable<{ mailboxes: string[] }> {
    return this.http.get<{ mailboxes: string[] }>(`${this.endpoint}/mailboxes`, {
      headers: this.authHeaders()
    });
  }

  listEmails(mailbox: string, query = '', cursor = '', day = ''): Observable<MailboxEmailList> {
    let params = new HttpParams().set('mailbox', mailbox).set('limit', '30');
    if (query.trim()) {
      params = params.set('q', query.trim());
    }
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    if (day) {
      params = params.set('day', day);
    }
    return this.http.get<MailboxEmailList>(this.endpoint, {
      headers: this.authHeaders(),
      params
    });
  }

  getEmail(id: string): Observable<MailboxEmailDetail> {
    return this.http.get<MailboxEmailDetail>(`${this.endpoint}/${encodeURIComponent(id)}`, {
      headers: this.authHeaders()
    });
  }

  updateStatus(id: string, status: 'read' | 'unread'): Observable<{ id: string; status: string }> {
    return this.http.patch<{ id: string; status: string }>(
      `${this.endpoint}/${encodeURIComponent(id)}`,
      { status },
      { headers: this.authHeaders() }
    );
  }

  sendEmail(payload: ComposeEmailPayload): Observable<{ id: string; status: string }> {
    return this.http.post<{ id: string; status: string }>(`${this.endpoint}/send`, payload, {
      headers: this.authHeaders()
    });
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders()
      .set('Authorization', `Bearer ${this.authService.getToken() || ''}`)
      .set('Content-Type', 'application/json');
  }
}
