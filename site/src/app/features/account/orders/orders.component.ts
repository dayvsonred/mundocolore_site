import { Component, OnInit } from '@angular/core';

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  products: any[];
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  activeFilter: string = 'todos';

  filters = [
    { key: 'todos', label: 'Todos' },
    { key: 'pendentes', label: 'Pendentes' },
    { key: 'entregues', label: 'Entregues' },
    { key: 'cancelados', label: 'Cancelados' }
  ];

  ngOnInit() {
    this.loadMockOrders();
    this.applyFilter('todos');
  }

  loadMockOrders() {
    this.orders = [
      {
        id: 'PED-001',
        date: '2024-01-15',
        total: 299.90,
        status: 'Entregue',
        products: [
          { name: 'Produto 1', quantity: 2 },
          { name: 'Produto 2', quantity: 1 }
        ]
      },
      {
        id: 'PED-002',
        date: '2024-01-20',
        total: 149.50,
        status: 'Pendente',
        products: [
          { name: 'Produto 3', quantity: 1 }
        ]
      },
      {
        id: 'PED-003',
        date: '2024-01-10',
        total: 89.90,
        status: 'Cancelado',
        products: [
          { name: 'Produto 4', quantity: 1 }
        ]
      }
    ];
  }

  applyFilter(filter: string) {
    this.activeFilter = filter;
    if (filter === 'todos') {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter(order =>
        order.status.toLowerCase() === filter.slice(0, -1) // remove 's' from plural
      );
    }
  }

  viewOrderDetails(order: Order) {
    // TODO: Navigate to order details
    console.log('View order details:', order);
  }

  reorder(order: Order) {
    // TODO: Add products to cart
    console.log('Reorder products from:', order);
  }
}