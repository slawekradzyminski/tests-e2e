
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

export class UserByUsernameClient {
  constructor(private readonly request: APIRequestContext) {}

  getByUsername(username: string, token?: string): Promise<APIResponse> {
    return this.request.get(`${APP_BASE_URL}/api/v1/users/${encodeURIComponent(username)}`, {
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
