
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

export class RefreshClient {
  constructor(private readonly request: APIRequestContext) {}

  refresh(refreshToken: string): Promise<APIResponse> {
    return this.refreshRaw({ refreshToken });
  }

  /** Allows invalid payloads without weakening the normal request signature. */
  refreshRaw(data: unknown): Promise<APIResponse> {
    return this.request.post(`${APP_BASE_URL}/api/v1/users/refresh`, { data });
  }
}
