
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

export class RightToBeForgottenClient {
  constructor(private readonly request: APIRequestContext) {}

  forget(username: string, token?: string): Promise<APIResponse> {
    return this.request.delete(`${APP_BASE_URL}/api/v1/users/${encodeURIComponent(username)}/right-to-be-forgotten`, {
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
