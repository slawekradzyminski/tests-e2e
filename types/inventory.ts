
export type InventoryStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryAdjustmentDto {
  delta: number;
  reason: string;
  requestId: string;
}

export interface InventoryItemDto {
  productId: number;
  name: string;
  category: string;
  availableQuantity: number;
  stockStatus: InventoryStockStatus;
  lastChangedAt: string;
}

export interface InventoryMovementDto {
  id: number;
  productId: number;
  orderId: number | null;
  type: 'INITIAL_STOCK' | 'ADMIN_ADJUSTMENT' | 'ORDER_DEDUCTED' | 'ORDER_RESTORED';
  delta: number;
  quantityAfter: number;
  actor: string;
  reason: string;
  requestId: string | null;
  createdAt: string;
}

export interface InventoryPage<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface InventoryListQuery {
  page?: number;
  size?: number;
  search?: string;
  category?: string;
  status?: InventoryStockStatus;
  lowStockThreshold?: number;
}

export interface InventoryMovementsQuery {
  page?: number;
  size?: number;
}
