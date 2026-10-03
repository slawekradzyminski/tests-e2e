
import type { HttpClient as APIRequestContext, HttpResponse as APIResponse } from '../../support/http';
import { APP_BASE_URL } from '../../test-config';
import type { ForgotPasswordRequestDto } from '../../types/account';

export class ForgotPasswordClient {
  constructor(private readonly request: APIRequestContext) {}

  requestReset(data: ForgotPasswordRequestDto): Promise<APIResponse> {
    return this.request.post(`${APP_BASE_URL}/api/v1/users/password/forgot`, { data });
  }
}
