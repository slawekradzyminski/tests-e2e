
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

export class LogoutClient {
  constructor(private readonly request: APIRequestContext) {}

  logout(token?: string): Promise<APIResponse> {
    return this.request.post(`${APP_BASE_URL}/api/v1/users/logout`, {
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
