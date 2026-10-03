
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

export class DeleteProductClient {
  constructor(private readonly request: APIRequestContext) {}

  delete(id: number | string, token?: string): Promise<APIResponse> {
    return this.request.delete(`${APP_BASE_URL}/api/v1/products/${id}`, {
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
