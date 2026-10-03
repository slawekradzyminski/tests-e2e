
import { expect } from 'e2e';
import { expectLoginJwt } from './jwt-validator';

/** Validates a completed login for an account without an MFA challenge. */
export function expectSuccessfulLogin(body: unknown, username: string): void {
  expect(body).toEqual({
    token: expect.any(String),
    refreshToken: expect.stringMatching(/\S+/),
    username,
    email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    firstName: expect.any(String),
    lastName: expect.any(String),
    roles: expect.any(Array),
    mfaRequired: false,
    challengeToken: null,
    challengeExpiresAt: null,
  });

  const { token, roles } = body as { token: string; roles: string[] };
  expect(roles.length).toBeGreaterThan(0);
  for (const role of roles) {
    expect(role).toMatch(/^ROLE_(ADMIN|CLIENT)$/);
  }
  expectLoginJwt(token, username, roles);
}
