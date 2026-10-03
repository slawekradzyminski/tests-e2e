
export interface CartItemDto { productId: number; quantity: number }
export interface AddressDto { street: string; city: string; state: string; zipCode: string; country: string }
export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export interface OrderQuery { page?: number; size?: number; status?: OrderStatus }
export interface OrderDto {
  id: number;
  username: string;
  items: { id: number; productId: number; quantity: number; productName: string; unitPrice: number; totalPrice: number }[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: AddressDto;
  createdAt: string;
  updatedAt: string;
}
