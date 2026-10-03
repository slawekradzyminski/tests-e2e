
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';
import type { AddressDto } from '../../types/commerce';

export class CreateOrderClient {
  constructor(private readonly request: APIRequestContext) {}

  create(data: AddressDto, token?: string): Promise<APIResponse> {
    return this.request.post(`${APP_BASE_URL}/api/v1/orders`, {
      data,
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
