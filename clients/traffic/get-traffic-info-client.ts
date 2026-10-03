
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

export class GetTrafficInfoClient {
  constructor(private readonly request: APIRequestContext) {}

  get(token?: string, clientSessionId?: string): Promise<APIResponse> {
    return this.request.get(`${APP_BASE_URL}/api/v1/traffic/info`, {
      headers: {
        ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }),
        ...(clientSessionId === undefined ? {} : { 'X-Client-Session-Id': clientSessionId }),
      },
    });
  }
}
