
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';
import type { InventoryMovementsQuery } from '../../types/inventory';

export class ListInventoryMovementsClient {
  constructor(private readonly request: APIRequestContext) {}

  list(productId: number, token: string | undefined, query?: InventoryMovementsQuery): Promise<APIResponse> {
    return this.request.get(`${APP_BASE_URL}/api/v1/admin/inventory/${productId}/movements`, {
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
      params: { ...query },
    });
  }
}
