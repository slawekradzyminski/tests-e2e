
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';
import type { ProductUpdateDto } from '../../types/product';

export class UpdateProductClient {
  constructor(private readonly request: APIRequestContext) {}

  update(id: number | string, data: ProductUpdateDto, token?: string): Promise<APIResponse> {
    return this.request.put(`${APP_BASE_URL}/api/v1/products/${id}`, {
      data,
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
