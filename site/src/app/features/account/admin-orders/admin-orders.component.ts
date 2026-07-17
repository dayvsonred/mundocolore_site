import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Order, OrderService } from '../../../core/services/order.service';
import { ProductBrandRecord, ProductCollectionRecord, ProductService } from '../../../core/services/product.service';
import { ConfirmDialogComponent, ConfirmDialogModel } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({ selector: 'app-admin-orders', templateUrl: './admin-orders.component.html', styleUrls: ['./admin-orders.component.scss'] })
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  page = 1;
  pageSize = 10;
  readonly pageSizeOptions = [10, 20, 50, 100, 200];
  brands: ProductBrandRecord[] = [];
  collections: ProductCollectionRecord[] = [];
  filters: Record<string, string | number> = { sort: 'date_desc' };
  selectedStatus: Record<string, string> = {};
  loading = false;
  loadingOptions = false;
  readonly statuses = [['approved','Aprovado'],['packed','Pedido embalado'],['shipped','Pedido enviado'],['delivered','Pedido entregue'],['finished','Pedido finalizado'],['cancelled','Pedido cancelado']];

  constructor(
    private ordersService: OrderService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadOrders();
  }

  loadFilterOptions(): void {
    this.loadingOptions = true;
    this.productService.getBrands().subscribe({
      next: brands => this.brands = brands,
      error: () => this.snackBar.open('Nao foi possivel carregar as marcas.', 'Fechar', { duration: 4000 })
    });
    this.productService.getCollections().pipe(finalize(() => this.loadingOptions = false)).subscribe({
      next: collections => this.collections = collections,
      error: () => this.snackBar.open('Nao foi possivel carregar as colecoes.', 'Fechar', { duration: 4000 })
    });
  }

  loadOrders(): void {
    this.loading = true;
    this.ordersService.getAdminOrders(this.filters).pipe(finalize(() => this.loading = false)).subscribe({
      next: orders => {
        this.orders = orders;
        this.page = 1;
        this.selectedStatus = orders.reduce((statuses, order) => {
          statuses[order.id] = '';
          return statuses;
        }, {} as Record<string, string>);
      },
      error: () => this.snackBar.open('Nao foi possivel carregar os pedidos.', 'Fechar', { duration: 4000 })
    });
  }

  get filteredCollections(): ProductCollectionRecord[] {
    const selectedBrand = String(this.filters['brand'] || '');
    if (!selectedBrand) return this.collections;
    return this.collections.filter(collection => this.collectionBrandValue(collection) === selectedBrand);
  }

  pendingApproval(): void { this.filters['status'] = 'pending_approval'; this.loadOrders(); }

  clearFilters(): void {
    this.filters = { sort: 'date_desc' };
    this.page = 1;
    this.loadOrders();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.orders.length / this.pageSize));
  }

  get pagedOrders(): Order[] {
    const start = (this.page - 1) * this.pageSize;
    return this.orders.slice(start, start + this.pageSize);
  }

  get pageStart(): number {
    if (!this.orders.length) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.page * this.pageSize, this.orders.length);
  }

  onPageSizeChange(): void {
    this.page = 1;
  }

  previousPage(): void {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage(): void {
    this.page = Math.min(this.totalPages, this.page + 1);
  }

  onBrandFilterChange(): void {
    const selectedCollection = String(this.filters['collection'] || '');
    if (selectedCollection && !this.filteredCollections.some(collection => this.collectionFilterValue(collection) === selectedCollection)) {
      this.filters['collection'] = '';
    }
  }

  changeStatus(order: Order, status: string): void {
    if (!status) return;
    const statusLabel = this.statusLabel(status);
    const dialogData = new ConfirmDialogModel(
      'Confirmar alteracao de status',
      `Deseja alterar o pedido ${order.id} para "${statusLabel}"?`
    );
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        this.selectedStatus[order.id] = '';
        return;
      }

      this.ordersService.updateOrderStatus(order.id, status).subscribe({
        next: updated => {
          Object.assign(order, updated);
          this.selectedStatus[order.id] = '';
          this.snackBar.open('Status do pedido atualizado.', 'Fechar', { duration: 3000 });
        },
        error: () => {
          this.selectedStatus[order.id] = '';
          this.snackBar.open('Nao foi possivel alterar o status.', 'Fechar', { duration: 4000 });
        }
      });
    });
  }

  statusLabel(value?: string): string {
    if (!value) return '-';
    const status = this.statuses.find(item => item[0] === value);
    if (status) return status[1];
    const labels: Record<string, string> = {
      pending_payment: 'Aguardando pagamento',
      pending_approval: 'Aguardando aprovacao'
    };
    return labels[value] || value;
  }

  brandFilterValue(brand: ProductBrandRecord): string {
    return brand.brand_key || brand.brand || brand.name;
  }

  collectionFilterValue(collection: ProductCollectionRecord): string {
    return collection.name || collection.slug || collection.collection_key || '';
  }

  collectionBrandValue(collection: ProductCollectionRecord): string {
    return collection.brand_key || collection.brand;
  }

  collectionLabel(collection: ProductCollectionRecord): string {
    const year = collection.year ? `${collection.year} - ` : '';
    return `${year}${collection.name || collection.slug || collection.collection_key}`;
  }
}
