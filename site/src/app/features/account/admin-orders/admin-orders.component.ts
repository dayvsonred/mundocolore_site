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

  get filteredCostSubtotal(): number {
    return this.orders.reduce((total, order) => total + Number(order.cost_subtotal || 0), 0);
  }

  get filteredBaseSubtotal(): number {
    return this.orders.reduce((total, order) => total + Number(order.subtotal || 0), 0);
  }

  get filteredSoldSubtotal(): number {
    return this.orders.reduce((total, order) => total + this.orderSoldSubtotal(order), 0);
  }

  get filteredDiscountAmount(): number {
    return this.orders.reduce((total, order) => total + Number(order.discount_amount || 0), 0);
  }

  get filteredGrossProfitAmount(): number {
    return this.orders.reduce((total, order) => total + this.orderGrossProfit(order), 0);
  }

  get filteredGrossMarginPercent(): number {
    return this.filteredSoldSubtotal > 0
      ? (this.filteredGrossProfitAmount / this.filteredSoldSubtotal) * 100
      : 0;
  }

  orderSoldSubtotal(order: Order): number {
    if (order.sold_subtotal !== undefined) return Number(order.sold_subtotal);
    return Number(order.subtotal || 0) - Number(order.discount_amount || 0);
  }

  orderGrossProfit(order: Order): number {
    if (order.gross_profit_amount !== undefined) return Number(order.gross_profit_amount);
    return this.orderSoldSubtotal(order) - Number(order.cost_subtotal || 0);
  }

  itemBaseSubtotal(item: Order['items'][number]): number {
    if (item.base_subtotal !== undefined) return Number(item.base_subtotal);
    return Number(item.base_unit_price || item.unit_price || item.price || 0) * item.quantity;
  }

  itemSoldSubtotal(item: Order['items'][number]): number {
    if (item.sold_subtotal !== undefined) return Number(item.sold_subtotal);
    return Number(item.subtotal || (Number(item.unit_price || item.price || 0) * item.quantity));
  }

  itemCostSubtotal(item: Order['items'][number]): number {
    if (item.cost_subtotal !== undefined) return Number(item.cost_subtotal);
    return Number(item.cost_unit_price || 0) * item.quantity;
  }

  itemGrossProfit(item: Order['items'][number]): number {
    if (item.gross_profit_amount !== undefined) return Number(item.gross_profit_amount);
    return this.itemSoldSubtotal(item) - this.itemCostSubtotal(item);
  }

  exportCsv(): void {
    if (!this.orders.length) return;
    const rows: Array<Array<string | number>> = [[
      'Pedido', 'Data', 'Status', 'Cliente', 'Produto', 'Descricao', 'Quantidade',
      'Custo unitario', 'Preco cheio unitario', 'Spread original (%)', 'Cupom',
      'Reducao do spread (p.p.)', 'Preco vendido unitario', 'Custo total',
      'Venda sem cupom', 'Desconto', 'Venda efetiva', 'Margem bruta'
    ]];
    for (const order of this.orders) {
      for (const item of order.items || []) {
        rows.push([
          order.id,
          order.created_at,
          this.statusLabel(order.status),
          order.customer?.name || '',
          item.product_code || item.product_id,
          item.product_name || '',
          item.quantity,
          this.csvMoney(item.cost_unit_price),
          this.csvMoney(item.base_unit_price),
          this.csvMoney(item.spread_percent_at_purchase),
          item.coupon_code || (item.coupon_reduction_percent ? order.coupon_code || '' : ''),
          this.csvMoney(item.coupon_reduction_percent),
          this.csvMoney(item.unit_price || item.price),
          this.csvMoney(this.itemCostSubtotal(item)),
          this.csvMoney(this.itemBaseSubtotal(item)),
          this.csvMoney(item.discount_amount),
          this.csvMoney(this.itemSoldSubtotal(item)),
          this.csvMoney(this.itemGrossProfit(item))
        ]);
      }
    }
    const csv = rows.map(row => row.map(value => this.csvCell(value)).join(';')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private csvMoney(value: number | undefined): string {
    return Number(value || 0).toFixed(2).replace('.', ',');
  }

  private csvCell(value: string | number): string {
    return `"${String(value).replace(/"/g, '""')}"`;
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
      pending_approval: 'Aguardando aprovacao',
      payment_review: 'Pagamento em analise'
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
