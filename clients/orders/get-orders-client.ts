
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';
import type { OrderQuery } from '../../types/commerce';

export class GetOrdersClient {
  constructor(private readonly request: APIRequestContext) {}

  get(token?: string, query: OrderQuery = {}): Promise<APIResponse> {
    return this.request.get(`${APP_BASE_URL}/api/v1/orders`, {
      params: { ...query },
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
