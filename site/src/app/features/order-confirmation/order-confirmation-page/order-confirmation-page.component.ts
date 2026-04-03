import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-order-confirmation-page',
  templateUrl: './order-confirmation-page.component.html',
  styleUrls: ['./order-confirmation-page.component.scss']
})
export class OrderConfirmationPageComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  trackOrder(): void {
    // Lógica para acompanhar pedido
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  continueShopping(): void {
    this.router.navigate(['/catalog']);
  }
}