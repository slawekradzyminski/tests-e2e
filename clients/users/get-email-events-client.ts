
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

export class GetEmailEventsClient {
  constructor(private readonly request: APIRequestContext) {}

  get(token?: string): Promise<APIResponse> {
    return this.request.get(`${APP_BASE_URL}/api/v1/users/me/email-events`, {
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
