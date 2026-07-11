import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Order, OrderService } from '../../../core/services/order.service';

@Component({ selector: 'app-admin-orders', templateUrl: './admin-orders.component.html', styleUrls: ['./admin-orders.component.scss'] })
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  filters: Record<string, string | number> = { sort: 'date_desc' };
  loading = false;
  readonly statuses = [['approved','Aprovado'],['packed','Pedido embalado'],['shipped','Pedido enviado'],['delivered','Pedido entregue'],['finished','Pedido finalizado'],['cancelled','Pedido cancelado']];
  constructor(private ordersService: OrderService, private snackBar: MatSnackBar) {}
  ngOnInit(): void { this.loadOrders(); }
  loadOrders(): void {
    this.loading = true;
    this.ordersService.getAdminOrders(this.filters).pipe(finalize(() => this.loading = false)).subscribe({
      next: orders => this.orders = orders,
      error: () => this.snackBar.open('Nao foi possivel carregar os pedidos.', 'Fechar', { duration: 4000 })
    });
  }
  pendingApproval(): void { this.filters['status'] = 'pending_approval'; this.loadOrders(); }
  clearFilters(): void { this.filters = { sort: 'date_desc' }; this.loadOrders(); }
  changeStatus(order: Order, status: string): void {
    if (!status) return;
    this.ordersService.updateOrderStatus(order.id, status).subscribe({
      next: updated => Object.assign(order, updated),
      error: () => this.snackBar.open('Nao foi possivel alterar o status.', 'Fechar', { duration: 4000 })
    });
  }
}
