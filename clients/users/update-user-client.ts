
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';
import type { UserEditDto } from '../../types/account';

export class UpdateUserClient {
  constructor(private readonly request: APIRequestContext) {}

  update(username: string, data: Partial<UserEditDto>, token?: string): Promise<APIResponse> {
    return this.request.put(`${APP_BASE_URL}/api/v1/users/${encodeURIComponent(username)}`, {
      data,
      headers: token === undefined ? {} : { Authorization: `Bearer ${token}` },
    });
  }
}
