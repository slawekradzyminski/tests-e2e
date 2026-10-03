
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

export class UsersClient {
  constructor(private readonly request: APIRequestContext) {}

  getAll(token?: string): Promise<APIResponse> {
    return this.request.get(`${APP_BASE_URL}/api/v1/users`, {
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
