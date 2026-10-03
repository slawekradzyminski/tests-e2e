
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import type { LoginDto } from '../../types/auth';
import { APP_BASE_URL } from '../../test-config';

export class LoginClient {
  constructor(private readonly request: APIRequestContext) {}

  login(credentials: LoginDto): Promise<APIResponse> {
    return this.request.post(`${APP_BASE_URL}/api/v1/users/signin`, {
      data: credentials,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
