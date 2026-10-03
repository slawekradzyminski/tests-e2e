
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

export class UpdateToolSystemPromptClient {
  constructor(private readonly request: APIRequestContext) {}

  update(toolSystemPrompt: string, token?: string): Promise<APIResponse> {
    return this.request.put(`${APP_BASE_URL}/api/v1/users/tool-system-prompt`, {
      data: { toolSystemPrompt },
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
