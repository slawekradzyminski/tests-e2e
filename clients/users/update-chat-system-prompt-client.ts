
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';

export class UpdateChatSystemPromptClient {
  constructor(private readonly request: APIRequestContext) {}

  update(chatSystemPrompt: string, token?: string): Promise<APIResponse> {
    return this.request.put(`${APP_BASE_URL}/api/v1/users/chat-system-prompt`, {
      data: { chatSystemPrompt },
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
