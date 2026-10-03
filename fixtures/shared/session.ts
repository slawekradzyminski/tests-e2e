
import { expect } from 'e2e';
import { LoginClient } from '../../clients/users/login-client';
import type { LoginDto } from '../../types/auth';

export interface Session {
  token: string;
  refreshToken: string;
}

export async function signIn(login: LoginClient, credentials: LoginDto, role: 'ROLE_ADMIN' | 'ROLE_CLIENT'): Promise<Session> {
  const response = await login.login(credentials);
  expect(response.status(), 'Authenticate fixture account').toBe(200);
  const body = await response.json();
  if (role === 'ROLE_CLIENT') {
    expect(body.roles).toEqual(['ROLE_CLIENT']);
  } else {
    expect(body.roles).toContain(role);
  }
  expect(body.mfaRequired).toBe(false);
  expect(body.token).toEqual(expect.stringMatching(/\S+/));
  expect(body.refreshToken).toEqual(expect.stringMatching(/\S+/));
  return { token: body.token, refreshToken: body.refreshToken };
}
