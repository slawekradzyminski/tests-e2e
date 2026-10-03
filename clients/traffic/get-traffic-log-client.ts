
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

export class GetTrafficLogClient {
  constructor(private readonly request: APIRequestContext) {}

  get(correlationId: string, token?: string, clientSessionId?: string): Promise<APIResponse> {
    return this.request.get(`${APP_BASE_URL}/api/v1/traffic/logs/${encodeURIComponent(correlationId)}`, {
      headers: {
        ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }),
        ...(clientSessionId === undefined ? {} : { 'X-Client-Session-Id': clientSessionId }),
      },
    });
  }
}
