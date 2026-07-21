import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize } from 'rxjs';

import {
  ComposeEmailPayload,
  EmailMailboxService,
  MailboxEmail,
  MailboxEmailDetail
} from '../../../core/services/email-mailbox.service';
import { NotificationService } from '../../../core/services/notification.service';

type MailFolder = 'unread' | 'read' | 'sent';

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
  activeFolder: MailFolder = 'unread';
  emails: MailboxEmail[] = [];
  selectedEmail: MailboxEmailDetail | null = null;
  nextCursor = '';
  currentPage = 1;
  readonly pageSize = 20;
  loadingList = false;
  loadingEmail = false;
  sending = false;
  composing = false;
  errorMessage = '';
  refreshIntervalSeconds = 0;
  lastUpdatedAt: Date | null = null;

  readonly folders: ReadonlyArray<{ id: MailFolder; label: string; icon: string }> = [
    { id: 'unread', label: 'Não lidos', icon: 'mark_email_unread' },
    { id: 'read', label: 'Lidos', icon: 'drafts' },
    { id: 'sent', label: 'Enviados', icon: 'send' }
  ];

  readonly refreshIntervalOptions = [
    { label: 'Desativada', value: 0 },
    { label: 'A cada 5 segundos', value: 5 },
    { label: 'A cada 10 segundos', value: 10 },
    { label: 'A cada 30 segundos', value: 30 },
    { label: 'A cada 1 minuto', value: 60 }
  ];

  compose: ComposeEmailPayload = this.emptyCompose();
  private pageCursors: string[] = [''];
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

  get isSentFolder(): boolean {
    return this.activeFolder === 'sent';
  }

  get pageNumbers(): number[] {
    const lastPage = this.currentPage + (this.nextCursor ? 1 : 0);
    const firstPage = Math.max(1, this.currentPage - 2);
    return Array.from({ length: lastPage - firstPage + 1 }, (_value, index) => firstPage + index);
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
            this.resetPaginationAndLoad();
          }
        },
        error: (error) => this.setError(error, 'Não foi possível carregar as caixas de e-mail.')
      });
  }

  selectFolder(folder: MailFolder): void {
    if (folder === this.activeFolder || this.loadingList) {
      return;
    }
    this.activeFolder = folder;
    this.selectedEmail = null;
    this.resetPaginationAndLoad();
  }

  onMailboxChange(): void {
    this.searchQuery = '';
    this.selectedDay = '';
    this.selectedEmail = null;
    this.compose.from_email = this.selectedMailbox;
    this.resetPaginationAndLoad();
  }

  applyFilters(): void {
    this.selectedEmail = null;
    this.resetPaginationAndLoad();
  }

  loadEmails(preserveSelection = false): void {
    if (!this.selectedMailbox || this.loadingList) {
      return;
    }
    this.loadingList = true;
    this.errorMessage = '';
    const cursor = this.pageCursors[this.currentPage - 1] || '';
    const receivedStatus: 'read' | 'unread' = this.activeFolder === 'read' ? 'read' : 'unread';
    const request$ = this.isSentFolder
      ? this.emailService.listSentEmails(this.selectedMailbox, this.searchQuery, cursor, this.selectedDay, this.pageSize)
      : this.emailService.listEmails(
          this.selectedMailbox,
          receivedStatus,
          this.searchQuery,
          cursor,
          this.selectedDay,
          this.pageSize
        );

    request$
      .pipe(finalize(() => this.loadingList = false))
      .subscribe({
        next: (response) => {
          this.emails = response.items || [];
          this.nextCursor = response.next_cursor || '';
          this.lastUpdatedAt = new Date();
          if (!preserveSelection) {
            this.selectedEmail = null;
          }
        },
        error: (error) => this.setError(error, 'Não foi possível carregar os e-mails.')
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page === this.currentPage || this.loadingList) {
      return;
    }
    if (page === this.currentPage + 1) {
      if (!this.nextCursor) {
        return;
      }
      this.pageCursors[page - 1] = this.nextCursor;
    } else if (typeof this.pageCursors[page - 1] !== 'string') {
      return;
    }
    this.currentPage = page;
    this.loadEmails();
  }

  refreshEmails(): void {
    this.loadEmails(true);
  }

  clearDayFilter(): void {
    if (!this.selectedDay) {
      return;
    }
    this.selectedDay = '';
    this.resetPaginationAndLoad();
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
    const wasUnread = this.activeFolder === 'unread';
    const request$ = this.isSentFolder
      ? this.emailService.getSentEmail(email.id)
      : this.emailService.getEmail(email.id);

    request$
      .pipe(finalize(() => this.loadingEmail = false))
      .subscribe({
        next: (detail) => {
          this.selectedEmail = detail;
          if (wasUnread) {
            this.emails = this.emails.filter((item) => item.id !== email.id);
          } else if (!this.isSentFolder) {
            email.status = 'read';
          }
        },
        error: (error) => this.setError(error, 'Não foi possível abrir o e-mail.')
      });
  }

  toggleUnread(): void {
    if (!this.selectedEmail || this.isSentFolder) {
      return;
    }
    const nextStatus = this.selectedEmail.status === 'unread' ? 'read' : 'unread';
    this.emailService.updateStatus(this.selectedEmail.id, nextStatus).subscribe({
      next: () => {
        if (!this.selectedEmail) {
          return;
        }
        this.selectedEmail.status = nextStatus;
        if (this.activeFolder === nextStatus) {
          this.loadEmails(true);
        } else {
          this.emails = this.emails.filter((item) => item.id !== this.selectedEmail?.id);
        }
      },
      error: (error) => this.setError(error, 'Não foi possível alterar o status do e-mail.')
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
          this.notificationService.openSnackBar('E-mail adicionado à fila de envio.');
          this.cancelCompose();
          if (this.isSentFolder) {
            this.resetPaginationAndLoad();
          }
        },
        error: (error) => this.setError(error, 'Não foi possível enviar o e-mail.')
      });
  }

  senderLabel(email: MailboxEmail): string {
    return this.isSentFolder
      ? `Para: ${email.to_email || 'Destinatário desconhecido'}`
      : (email.from_email || 'Remetente desconhecido');
  }

  sentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      sent: 'Enviado',
      failed: 'Falhou',
      received: 'Processando',
      queued: 'Na fila'
    };
    return labels[status] || status;
  }

  trackByEmailId(_index: number, email: MailboxEmail): string {
    return email.id;
  }

  private resetPaginationAndLoad(): void {
    this.currentPage = 1;
    this.nextCursor = '';
    this.pageCursors = [''];
    this.loadEmails();
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
