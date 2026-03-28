import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Stripe, StripeElements, StripeCardNumberElement, StripeCardExpiryElement, StripeCardCvcElement } from '@stripe/stripe-js';
import { PaymentMethod } from '../../donate.models';

@Component({
  selector: 'app-payment-method',
  templateUrl: './payment-method.component.html',
  styleUrls: ['./payment-method.component.scss']
})
export class PaymentMethodComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() form!: FormGroup;
  @Input() stripe: Stripe | null = null;
  @Input() elements: StripeElements | null = null;
  @Input() checkoutOnly = false;
  @Output() methodChanged = new EventEmitter<PaymentMethod>();

  @ViewChild('cardNumber') cardNumberRef?: ElementRef<HTMLDivElement>;
  @ViewChild('cardExpiry') cardExpiryRef?: ElementRef<HTMLDivElement>;
  @ViewChild('cardCvc') cardCvcRef?: ElementRef<HTMLDivElement>;

  cardNumberElement?: StripeCardNumberElement;
  cardExpiryElement?: StripeCardExpiryElement;
  cardCvcElement?: StripeCardCvcElement;
  cardError = '';
  private mounted = false;

  selectMethod(method: PaymentMethod): void {
    if (this.form) {
      this.form.patchValue({ paymentMethod: method });
      this.form.get('paymentMethod')?.markAsTouched();
    }
    this.methodChanged.emit(method);
    if (method === 'card') {
      setTimeout(() => this.mountCardElements(), 0);
    }
  }

  get cardGroup(): FormGroup {
    return this.form.get('card') as FormGroup;
  }

  ngAfterViewInit(): void {
    if (!this.checkoutOnly) {
      this.mountCardElements();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.checkoutOnly && changes['elements'] && this.elements) {
      this.resetStripeElements();
      this.mountCardElements();
    }
  }

  ngOnDestroy(): void {
    this.resetStripeElements();
  }

  private resetStripeElements(): void {
    this.cardNumberElement?.unmount();
    this.cardExpiryElement?.unmount();
    this.cardCvcElement?.unmount();
    this.cardNumberElement = undefined;
    this.cardExpiryElement = undefined;
    this.cardCvcElement = undefined;
    this.mounted = false;
  }

  private mountCardElements(): void {
    if (this.checkoutOnly) {
      return;
    }
    if (!this.elements || !this.cardNumberRef || !this.cardExpiryRef || !this.cardCvcRef) {
      return;
    }

    if (!this.cardNumberElement || !this.cardExpiryElement || !this.cardCvcElement) {
      const style = {
        base: {
          color: '#1d2939',
          fontSize: '15px',
          fontFamily: 'Roboto, Arial, sans-serif',
          fontSmoothing: 'antialiased',
          '::placeholder': { color: '#98a2b3' }
        },
        invalid: {
          color: '#b42318'
        }
      };

      this.cardNumberElement = this.elements.create('cardNumber', {
        style,
        placeholder: '1234 1234 1234 1234'
      });
      this.cardExpiryElement = this.elements.create('cardExpiry', {
        style,
        placeholder: 'MM / AA'
      });
      this.cardCvcElement = this.elements.create('cardCvc', {
        style,
        placeholder: 'CVV'
      });

      this.attachElementHandlers(this.cardNumberElement, this.cardNumberRef.nativeElement);
      this.attachElementHandlers(this.cardExpiryElement, this.cardExpiryRef.nativeElement);
      this.attachElementHandlers(this.cardCvcElement, this.cardCvcRef.nativeElement);
    }

    const numberHost = this.cardNumberRef.nativeElement;
    const expiryHost = this.cardExpiryRef.nativeElement;
    const cvcHost = this.cardCvcRef.nativeElement;

    const needsMount =
      !numberHost.firstChild ||
      !expiryHost.firstChild ||
      !cvcHost.firstChild ||
      !this.mounted;

    if (!needsMount) {
      return;
    }

    this.cardNumberElement?.unmount();
    this.cardExpiryElement?.unmount();
    this.cardCvcElement?.unmount();

    this.cardNumberElement?.mount(this.cardNumberRef.nativeElement);
    this.cardExpiryElement?.mount(this.cardExpiryRef.nativeElement);
    this.cardCvcElement?.mount(this.cardCvcRef.nativeElement);
    this.mounted = true;
    console.log('Stripe Elements montados.');
  }

  private attachElementHandlers(
    element: StripeCardNumberElement | StripeCardExpiryElement | StripeCardCvcElement,
    host: HTMLDivElement
  ): void {
    const stripeElement = element as any;
    stripeElement.on('focus', () => host.classList.add('is-focused'));
    stripeElement.on('blur', () => host.classList.remove('is-focused'));
    stripeElement.on('change', (event: any) => {
      this.cardError = event.error?.message || '';
      if (event.error) {
        host.classList.add('is-invalid');
      } else {
        host.classList.remove('is-invalid');
      }
    });
  }
}
