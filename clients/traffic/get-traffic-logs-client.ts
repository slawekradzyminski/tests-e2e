
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

import type { TrafficLogsQuery } from '../../types/traffic';

export class GetTrafficLogsClient {
  constructor(private readonly request: APIRequestContext) {}

  get(token: string | undefined, clientSessionId: string | undefined, query: TrafficLogsQuery = {}): Promise<APIResponse> {
    return this.request.get(`${APP_BASE_URL}/api/v1/traffic/logs`, {
      params: { ...query },
      headers: {
        ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }),
        ...(clientSessionId === undefined ? {} : { 'X-Client-Session-Id': clientSessionId }),
      },
    });
  }
}
