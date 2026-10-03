
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

export class DeleteUserClient {
  constructor(private readonly request: APIRequestContext) {}

  deleteUser(username: string, token?: string): Promise<APIResponse> {
    return this.request.delete(`${APP_BASE_URL}/api/v1/users/${encodeURIComponent(username)}`, {
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
