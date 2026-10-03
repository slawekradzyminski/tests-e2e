
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

export class CancelOrderClient {
  constructor(private readonly request: APIRequestContext) {}

  cancel(id: number | string, token?: string): Promise<APIResponse> {
    return this.request.post(`${APP_BASE_URL}/api/v1/orders/${encodeURIComponent(id)}/cancel`, {
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
