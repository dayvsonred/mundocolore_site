import { Component, OnInit } from '@angular/core';

import { Order, OrderService } from '../../../core/services/order.service';

interface OrderView {
  id: string;
  date: string;
  total: number;
  status: string;
  statusKey: string;
  products: OrderProductView[];
  raw: Order;
}

interface OrderProductView {
  code: string;
  name: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  subtotal: number;
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: OrderView[] = [];
  filteredOrders: OrderView[] = [];
  activeFilter = 'todos';
  loading = false;
  errorMessage = '';
  expandedOrderId: string | null = null;

  filters = [
    { key: 'todos', label: 'Todos' },
    { key: 'pendentes', label: 'Pendentes' },
    { key: 'entregues', label: 'Entregues' },
    { key: 'cancelados', label: 'Cancelados' }
  ];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders = (orders || []).map((order) => this.toOrderView(order));
        this.applyFilter(this.activeFilter);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar seus pedidos.';
        this.loading = false;
      }
    });
  }

  applyFilter(filter: string): void {
    this.activeFilter = filter;
    if (filter === 'todos') {
      this.filteredOrders = this.orders;
      return;
    }

    this.filteredOrders = this.orders.filter((order) => order.statusKey === filter);
  }

  viewOrderDetails(order: OrderView): void {
    this.expandedOrderId = this.expandedOrderId === order.id ? null : order.id;
  }

  isOrderExpanded(order: OrderView): boolean {
    return this.expandedOrderId === order.id;
  }

  reorder(order: OrderView): void {
    console.log('Reorder products from:', order.raw);
  }

  private toOrderView(order: Order): OrderView {
    const statusKey = this.mapStatusKey(order.status);
    return {
      id: order.id,
      date: order.created_at,
      total: order.total,
      status: this.mapStatusLabel(order.status),
      statusKey,
      products: (order.items || []).map((item) => ({
        code: item.product_code || item.product_snapshot?.produto_id || item.product_snapshot?.product_code || item.product_id,
        name: item.product_name || item.product_id,
        color: item.color || 'Nao informado',
        size: item.size || 'Nao informado',
        quantity: item.quantity,
        price: item.unit_price || item.price || 0,
        subtotal: item.subtotal || (item.unit_price || item.price || 0) * item.quantity
      })),
      raw: order
    };
  }

  private mapStatusKey(status: string): string {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('cancel')) {
      return 'cancelados';
    }
    if (normalized.includes('deliver') || normalized.includes('entreg')) {
      return 'entregues';
    }
    return 'pendentes';
  }

  private mapStatusLabel(status: string): string {
    const statusKey = this.mapStatusKey(status);
    if (statusKey === 'cancelados') {
      return 'Cancelado';
    }
    if (statusKey === 'entregues') {
      return 'Entregue';
    }
    return 'Pendente';
  }
}
