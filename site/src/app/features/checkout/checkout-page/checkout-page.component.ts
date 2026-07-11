import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Address, AddressPayload, AddressService } from '../../../core/services/address.service';
import { AuthenticationService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CreateOrderPayload, Order, OrderPayment, OrderService } from '../../../core/services/order.service';
import { CartItem } from '../../../core/models/product.model';
import { CreditColore, CreditColoreService } from '../../../core/services/credit-colore.service';

type CheckoutStep = 'address' | 'payment' | 'review' | 'order-payment';

interface PaymentOption extends OrderPayment {
  description: string;
  icon: string;
}

@Component({
  selector: 'app-checkout-page',
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.scss']
})
export class CheckoutPageComponent implements OnInit {
  currentStep: CheckoutStep = 'address';
  cartItems: CartItem[] = [];
  addresses: Address[] = [];
  selectedAddress: Address | null = null;
  selectedPayment: PaymentOption | null = null;
  createdOrder: Order | null = null;
  currentUser: any | null = null;
  subtotal = 0;
  shippingAmount = 0;
  discountAmount = 0;
  total = 0;
  loading = false;
  errorMessage = '';
  couponCode = '';
  appliedCouponCode = '';
  applyingCoupon = false;
  private couponUnitPrices: Record<string, number> = {};
  creditColore: CreditColore | null = null;
  creditColoreInstallments = 1;

  addressForm: AddressPayload = {
    observation: 'Endereco principal',
    complement: '',
    number: '',
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    is_default: true
  };

  readonly paymentOptions: PaymentOption[] = [
    {
      method: 'pix',
      label: 'PIX',
      amount: 0,
      status: 'pending',
      icon: 'qr_code_2',
      description: 'Os dados para pagamento serao exibidos apos a confirmacao.'
    },
    {
      method: 'credit_card',
      label: 'Cartao de credito',
      amount: 0,
      status: 'pending',
      icon: 'credit_card',
      description: 'Os dados do cartao serao solicitados na tela de pagamento.'
    },
    {
      method: 'boleto',
      label: 'Boleto',
      amount: 0,
      status: 'pending',
      icon: 'receipt_long',
      description: 'O boleto sera gerado apos a confirmacao da compra.'
    },
    {
      method: 'credit_colore',
      label: 'Credito Colore',
      amount: 0,
      status: 'pending_approval',
      icon: 'account_balance_wallet',
      description: 'Use seu credito pre-aprovado e parcele em ate 5 vezes.'
    }
  ];

  constructor(
    private addressService: AddressService,
    private authService: AuthenticationService,
    private cartService: CartService,
    private orderService: OrderService,
    private creditColoreService: CreditColoreService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items;
      this.clearCoupon(false);
      this.calculateTotals();
      if (!items.length && this.currentStep !== 'order-payment') {
        this.router.navigate(['/cart']);
      }
    });

    this.loadAddresses();
    this.creditColoreService.getCredit().subscribe({
      next: credit => this.creditColore = credit,
      error: () => this.creditColore = null
    });
  }

  loadAddresses(): void {
    this.loading = true;
    this.errorMessage = '';

    this.addressService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses || [];
        this.selectedAddress = this.addresses.find((address) => address.is_default) || this.addresses[0] || null;
        this.currentStep = this.selectedAddress ? 'payment' : 'address';
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Nao foi possivel carregar os enderecos.';
      }
    });
  }

  continueFromAddress(): void {
    if (this.selectedAddress) {
      this.currentStep = 'payment';
      this.errorMessage = '';
      return;
    }

    if (!this.isAddressFormValid()) {
      this.errorMessage = 'Preencha o endereco de entrega para continuar.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.addressService.createAddress(this.addressForm).subscribe({
      next: (address) => {
        this.selectedAddress = address;
        this.addresses = [address, ...this.addresses];
        this.currentStep = 'payment';
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Nao foi possivel salvar o endereco.';
      }
    });
  }

  selectAddress(address: Address): void {
    this.selectedAddress = address;
  }

  selectPayment(payment: PaymentOption): void {
    this.selectedPayment = {
      ...payment,
      amount: this.total
    };
  }

  continueFromPayment(): void {
    if (!this.selectedPayment) {
      this.errorMessage = 'Selecione uma forma de pagamento para continuar.';
      return;
    }
    if (this.selectedPayment.method === 'credit_colore' && (!this.creditColore || this.creditColore.available_credit < this.total)) {
      this.errorMessage = 'Seu saldo de Credito Colore nao e suficiente para esta compra.';
      return;
    }

    this.errorMessage = '';
    this.currentStep = 'review';
  }

  goToAddressStep(): void {
    this.currentStep = 'address';
    this.errorMessage = '';
  }

  goToPaymentStep(): void {
    this.currentStep = 'payment';
    this.errorMessage = '';
  }

  confirmOrder(): void {
    if (!this.selectedAddress || !this.selectedPayment || !this.cartItems.length) {
      this.errorMessage = 'Revise endereco, pagamento e produtos antes de confirmar.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.orderService.createOrder(this.buildOrderPayload()).subscribe({
      next: (order) => {
        this.createdOrder = order;
        this.currentStep = 'order-payment';
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Nao foi possivel confirmar o pedido.';
      }
    });
  }

  applyCoupon(): void {
    const code = this.couponCode.trim();
    if (!code) {
      this.errorMessage = 'Informe o codigo do cupom.';
      return;
    }
    this.applyingCoupon = true;
    this.errorMessage = '';
    this.orderService.validateCoupon(code, this.cartItems.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: Number(item.product.price || 0)
    }))).subscribe({
      next: (response) => {
        this.appliedCouponCode = response.coupon_code;
        this.couponCode = response.coupon_code;
        this.couponUnitPrices = response.items.reduce((prices, item) => {
          prices[item.product_id] = Number(item.unit_price || item.price || 0);
          return prices;
        }, {} as Record<string, number>);
        this.subtotal = response.subtotal;
        this.discountAmount = response.discount_amount;
        this.total = this.subtotal + this.shippingAmount - this.discountAmount;
        this.updateSelectedPaymentAmount();
        this.applyingCoupon = false;
      },
      error: () => {
        this.clearCoupon(false);
        this.applyingCoupon = false;
        this.errorMessage = 'Cupom invalido para os produtos selecionados.';
      }
    });
  }

  clearCoupon(clearInput = true): void {
    this.appliedCouponCode = '';
    this.couponUnitPrices = {};
    this.discountAmount = 0;
    if (clearInput) this.couponCode = '';
    if (this.cartItems.length) this.calculateTotals();
  }

  get addressLine(): string {
    if (!this.selectedAddress) {
      return '';
    }

    const address = this.selectedAddress;
    return `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state}`;
  }

  get deliveryEstimateText(): string {
    return 'Chega em alguns dias apos a confirmacao do pagamento';
  }

  get buyerName(): string {
    return this.currentUser?.fullName || this.currentUser?.name || 'Comprador';
  }

  get buyerCpf(): string {
    return this.currentUser?.cpf || 'CPF nao informado';
  }

  get buyerEmail(): string {
    return this.currentUser?.email || '';
  }

  getProductCode(item: CartItem): string {
    return item.product.produto_id || item.product.id;
  }

  private calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0);
    this.total = this.subtotal + this.shippingAmount - this.discountAmount;
    this.updateSelectedPaymentAmount();
  }

  private updateSelectedPaymentAmount(): void {
    if (this.selectedPayment) this.selectedPayment = { ...this.selectedPayment, amount: this.total };
  }

  private isAddressFormValid(): boolean {
    return !!(
      this.addressForm.observation &&
      this.addressForm.complement &&
      this.addressForm.number &&
      this.addressForm.street &&
      this.addressForm.neighborhood &&
      this.addressForm.city &&
      this.addressForm.state &&
      this.addressForm.zip_code
    );
  }

  private buildOrderPayload(): CreateOrderPayload {
    const customer = {
      id: this.currentUser?.id || this.currentUser?.id_user || '',
      name: this.buyerName,
      email: this.buyerEmail,
      cpf: this.currentUser?.cpf || '',
      phone: this.currentUser?.phone || ''
    };

    return {
      items: this.cartItems.map((item) => {
        const unitPrice = this.couponUnitPrices[item.product.id] ?? Number(item.product.price || 0);
        const productCode = item.product.produto_id || item.product.id;
        return {
          product_id: item.product.id,
          product_code: productCode,
          product_name: item.product.name,
          product_image: item.product.image || item.product.image_url || '',
          brand: item.product.brand || '',
          collection: item.product.collection || '',
          category: item.product.category || '',
          type: item.product.type || '',
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: unitPrice,
          unit_price: unitPrice,
          subtotal: unitPrice * item.quantity,
          product_snapshot: {
            id: item.product.id,
            produto_id: item.product.produto_id,
            product_code: productCode,
            name: item.product.name,
            brand: item.product.brand,
            brand_key: item.product.brand_key,
            collection: item.product.collection,
            collection_slug: item.product.collection_slug,
            category: item.product.category,
            type: item.product.type,
            image: item.product.image,
            image_url: item.product.image_url,
            price_at_purchase: unitPrice,
            selected_size: item.size,
            selected_color: item.color
          }
        };
      }),
      subtotal: this.subtotal,
      shipping_amount: this.shippingAmount,
      discount_amount: this.discountAmount,
      coupon_code: this.appliedCouponCode || undefined,
      total: this.total,
      currency: 'BRL',
      billing: customer,
      customer,
      delivery_address: {
        id: this.selectedAddress?.id || '',
        observation: this.selectedAddress?.observation || '',
        complement: this.selectedAddress?.complement || '',
        number: this.selectedAddress?.number || '',
        street: this.selectedAddress?.street || '',
        neighborhood: this.selectedAddress?.neighborhood || '',
        city: this.selectedAddress?.city || '',
        state: this.selectedAddress?.state || '',
        country: this.selectedAddress?.country || 'Brasil',
        zip_code: this.selectedAddress?.zip_code || '',
        is_default: !!this.selectedAddress?.is_default
      },
      payment: {
        method: this.selectedPayment?.method || '',
        label: this.selectedPayment?.label || '',
        amount: this.total,
        status: this.selectedPayment?.method === 'credit_colore' ? 'pending_approval' : 'pending',
        installments: this.selectedPayment?.method === 'credit_colore' ? this.creditColoreInstallments : 1
      },
      checkout_metadata: {
        source: 'site',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        language: typeof navigator !== 'undefined' ? navigator.language : 'pt-BR',
        captured_at: new Date().toISOString()
      }
    };
  }
}
