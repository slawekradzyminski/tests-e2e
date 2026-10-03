
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';
import type { OrderStatus } from '../../types/commerce';

export class UpdateOrderStatusClient {
  constructor(private readonly request: APIRequestContext) {}

  update(id: number | string, status: OrderStatus, token?: string): Promise<APIResponse> {
    return this.request.put(`${APP_BASE_URL}/api/v1/orders/${encodeURIComponent(id)}/status`, {
      data: status,
      headers: { 'Content-Type': 'application/json', ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }) },
    });
  }
}
