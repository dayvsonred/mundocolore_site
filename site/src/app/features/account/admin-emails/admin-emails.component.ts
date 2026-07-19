import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize } from 'rxjs';

import {
  ComposeEmailPayload,
  EmailMailboxService,
  MailboxEmail,
  MailboxEmailDetail
} from '../../../core/services/email-mailbox.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-emails',
  templateUrl: './admin-emails.component.html',
  styleUrls: ['./admin-emails.component.scss']
})
export class AdminEmailsComponent implements OnInit, OnDestroy {
  mailboxes: string[] = [];
  selectedMailbox = '';
  selectedDay = '';
  searchQuery = '';
  emails: MailboxEmail[] = [];
  selectedEmail: MailboxEmailDetail | null = null;
  nextCursor = '';
  loadingList = false;
  loadingEmail = false;
  sending = false;
  composing = false;
  errorMessage = '';
  refreshIntervalSeconds = 0;
  lastUpdatedAt: Date | null = null;

  readonly refreshIntervalOptions = [
    { label: 'Desativada', value: 0 },
    { label: 'A cada 5 segundos', value: 5 },
    { label: 'A cada 10 segundos', value: 10 },
    { label: 'A cada 30 segundos', value: 30 },
    { label: 'A cada 1 minuto', value: 60 }
  ];

  compose: ComposeEmailPayload = this.emptyCompose();
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private emailService: EmailMailboxService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadMailboxes();
  }

  ngOnDestroy(): void {
    this.clearRefreshTimer();
  }

  loadMailboxes(): void {
    this.loadingList = true;
    this.errorMessage = '';
    this.emailService.getMailboxes()
      .pipe(finalize(() => this.loadingList = false))
      .subscribe({
        next: ({ mailboxes }) => {
          this.mailboxes = mailboxes || [];
          this.selectedMailbox = this.mailboxes[0] || '';
          this.compose = this.emptyCompose();
          if (this.selectedMailbox) {
            this.loadEmails();
          }
        },
        error: (error) => this.setError(error, 'Nao foi possivel carregar as caixas de email.')
      });
  }

  onMailboxChange(): void {
    this.searchQuery = '';
    this.selectedEmail = null;
    this.compose.from_email = this.selectedMailbox;
    this.loadEmails();
  }

  loadEmails(append = false, preserveSelection = false): void {
    if (!this.selectedMailbox || this.loadingList) {
      return;
    }
    this.loadingList = true;
    this.errorMessage = '';
    const cursor = append ? this.nextCursor : '';
    this.emailService.listEmails(this.selectedMailbox, this.searchQuery, cursor, this.selectedDay)
      .pipe(finalize(() => this.loadingList = false))
      .subscribe({
        next: (response) => {
          this.emails = append ? [...this.emails, ...(response.items || [])] : (response.items || []);
          this.nextCursor = response.next_cursor || '';
          this.lastUpdatedAt = new Date();
          if (!append && !preserveSelection) {
            this.selectedEmail = null;
          }
        },
        error: (error) => this.setError(error, 'Nao foi possivel carregar os emails.')
      });
  }

  refreshEmails(): void {
    this.loadEmails(false, true);
  }

  clearDayFilter(): void {
    if (!this.selectedDay) {
      return;
    }
    this.selectedDay = '';
    this.loadEmails();
  }

  onRefreshIntervalChange(): void {
    this.clearRefreshTimer();
    if (this.refreshIntervalSeconds <= 0) {
      return;
    }

    this.refreshEmails();
    this.refreshTimer = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        this.refreshEmails();
      }
    }, this.refreshIntervalSeconds * 1000);
  }

  openEmail(email: MailboxEmail): void {
    this.loadingEmail = true;
    this.errorMessage = '';
    this.emailService.getEmail(email.id)
      .pipe(finalize(() => this.loadingEmail = false))
      .subscribe({
        next: (detail) => {
          this.selectedEmail = detail;
          email.status = 'read';
        },
        error: (error) => this.setError(error, 'Nao foi possivel abrir o email.')
      });
  }

  toggleUnread(): void {
    if (!this.selectedEmail) {
      return;
    }
    const nextStatus = this.selectedEmail.status === 'unread' ? 'read' : 'unread';
    this.emailService.updateStatus(this.selectedEmail.id, nextStatus).subscribe({
      next: () => {
        if (this.selectedEmail) {
          this.selectedEmail.status = nextStatus;
          const listEmail = this.emails.find((item) => item.id === this.selectedEmail?.id);
          if (listEmail) {
            listEmail.status = nextStatus;
          }
        }
      },
      error: (error) => this.setError(error, 'Nao foi possivel alterar o status do email.')
    });
  }

  startCompose(): void {
    this.compose = this.emptyCompose();
    this.composing = true;
  }

  cancelCompose(): void {
    this.composing = false;
    this.compose = this.emptyCompose();
  }

  sendEmail(): void {
    if (this.sending || !this.compose.from_email || !this.compose.to_email || !this.compose.subject || !this.compose.body) {
      return;
    }
    this.sending = true;
    this.errorMessage = '';
    this.emailService.sendEmail(this.compose)
      .pipe(finalize(() => this.sending = false))
      .subscribe({
        next: () => {
          this.notificationService.openSnackBar('Email adicionado a fila de envio.');
          this.cancelCompose();
        },
        error: (error) => this.setError(error, 'Nao foi possivel enviar o email.')
      });
  }

  trackByEmailId(_index: number, email: MailboxEmail): string {
    return email.id;
  }

  private emptyCompose(): ComposeEmailPayload {
    return {
      from_email: this.selectedMailbox,
      to_email: '',
      to_name: '',
      subject: '',
      body: ''
    };
  }

  private setError(error: any, fallback: string): void {
    this.errorMessage = error?.error?.error || error?.error?.message || fallback;
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
