
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

export class RemoveCartItemClient {
  constructor(private readonly request: APIRequestContext) {}

  remove(productId: number | string, token?: string): Promise<APIResponse> {
    return this.request.delete(`${APP_BASE_URL}/api/v1/cart/items/${encodeURIComponent(productId)}`, {
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
