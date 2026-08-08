import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthenticationService } from '../../../core/services/auth.service';
import { InfinitePayStatus, PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-infinitepay-return',
  templateUrl: './infinitepay-return.component.html',
  styleUrls: ['./infinitepay-return.component.scss']
})
export class InfinitePayReturnComponent implements OnInit {
  loading = true;
  errorMessage = '';
  payment: InfinitePayStatus | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthenticationService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    const params = this.route.snapshot.queryParamMap;
    const orderNsu = params.get('order_nsu') || '';
    const transactionNsu = params.get('transaction_nsu') || '';
    const slug = params.get('slug') || params.get('invoice_slug') || '';
    const receiptUrl = params.get('receipt_url') || '';

    if (!orderNsu || !transactionNsu || !slug) {
      this.loading = false;
      this.errorMessage = 'A InfinitePay nao retornou todos os identificadores do pagamento.';
      return;
    }

    this.paymentService.confirmInfinitePayPayment({
      order_nsu: orderNsu,
      transaction_nsu: transactionNsu,
      slug,
      receipt_url: receiptUrl
    }).subscribe({
      next: payment => {
        this.payment = payment;
        this.loading = false;
      },
      error: () => this.loadStatus(orderNsu)
    });
  }

  get approved(): boolean {
    return this.payment?.status === 'paid';
  }

  get underReview(): boolean {
    return this.payment?.status === 'method_review' || this.payment?.status === 'amount_review';
  }

  get paymentMethodLabel(): string {
    return this.payment?.actual_method === 'pix' ? 'PIX' : 'Cartao de credito';
  }

  private loadStatus(orderNsu: string): void {
    this.paymentService.getInfinitePayStatus(orderNsu).subscribe({
      next: payment => {
        this.payment = payment;
        this.loading = false;
        if (payment.status === 'pending') {
          this.errorMessage = 'O pagamento ainda esta sendo confirmado. Consulte seus pedidos em alguns instantes.';
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Nao foi possivel confirmar o pagamento. O pedido continua salvo e sera atualizado pelo webhook.';
      }
    });
  }
}
