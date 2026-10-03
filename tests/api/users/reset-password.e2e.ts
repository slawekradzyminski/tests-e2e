import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { LoginClient } from '../../../clients/users/login-client';
import { ForgotPasswordClient } from '../../../clients/users/forgot-password-client';
import { ResetPasswordClient } from '../../../clients/users/reset-password-client';
import type { ForgotPasswordResponseDto } from '../../../types/account';
import { RefreshClient } from '../../../clients/users/refresh-client';

test.describe('POST /api/v1/users/password/reset', () => {
  let loginClient: LoginClient;
  let forgotClient: ForgotPasswordClient;
  let resetClient: ResetPasswordClient;
  let refreshClient: RefreshClient;

  test.beforeEach(async ({ request }) => {
    // given
    loginClient = new LoginClient(request);
    forgotClient = new ForgotPasswordClient(request);
    resetClient = new ResetPasswordClient(request);
    refreshClient = new RefreshClient(request);
  });

  async function captureLocalResetToken(username: string): Promise<string> {
    const response = await forgotClient.requestReset({ identifier: username });
    expect(response.status()).toBe(202);
    const { token }: ForgotPasswordResponseDto = await response.json();
    // The local training profile exposes tokens; this does not assert email delivery.
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('Local profile must enable password-reset.expose-token-in-response');
    }
    return token;
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account","createAccount"]))('should reset the password and revoke only refresh sessions belonging to that account - 200', async ({ account, createAccount }) => {
    // given
    const secondSession = await loginClient.login({ username: account.user.username, password: account.user.password });
    expect(secondSession.status()).toBe(200);
    const secondSessionBody = await secondSession.json();
    expect(secondSessionBody.refreshToken).toEqual(expect.stringMatching(/\S+/));
    const unrelated = await createAccount();
    const token = await captureLocalResetToken(account.user.username);
    const newPassword = 'NewPass123!';

    // when
    const response = await resetClient.reset({ token, newPassword, confirmPassword: newPassword });

    // then
    expect(response.status()).toBe(200);
    expect(await response.text()).toBe('');
    const oldLogin = await loginClient.login({ username: account.user.username, password: account.user.password });
    expect(oldLogin.status()).toBe(422);
    expect(await oldLogin.json()).toEqual({ message: 'Invalid username/password supplied' });
    const newLogin = await loginClient.login({ username: account.user.username, password: newPassword });
    expect(newLogin.status()).toBe(200);
    expect(await newLogin.json()).toMatchObject({ username: account.user.username, roles: ['ROLE_CLIENT'], token: expect.stringMatching(/\S+/) });
    for (const refreshToken of [account.refreshToken, secondSessionBody.refreshToken]) {
      const revoked = await refreshClient.refresh(refreshToken);
      expect(revoked.status()).toBe(401);
      expect(await revoked.json()).toEqual({ message: 'Invalid refresh token' });
    }
    const unaffected = await refreshClient.refresh(unrelated.refreshToken);
    expect(unaffected.status()).toBe(200);
    expect(await unaffected.json()).toMatchObject({ token: expect.stringMatching(/\S+/), refreshToken: expect.stringMatching(/\S+/) });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject an invalid reset token without changing the password or session - 400', async ({ account }) => {
    // given
    const payload = { token: 'invalid-reset-token', newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' };

    // when
    const response = await resetClient.reset(payload);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ message: 'Invalid password reset token' });
    expect((await loginClient.login({ username: account.user.username, password: account.user.password })).status()).toBe(200);
    expect((await refreshClient.refresh(account.refreshToken)).status()).toBe(200);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject mismatched passwords without consuming a valid token - 400', async ({ account }) => {
    // given
    const token = await captureLocalResetToken(account.user.username);

    // when
    const response = await resetClient.reset({ token, newPassword: 'NewPass123!', confirmPassword: 'DifferentPass123!' });

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ message: 'Passwords do not match' });
    expect((await loginClient.login({ username: account.user.username, password: account.user.password })).status()).toBe(200);
    expect((await resetClient.reset({ token, newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' })).status()).toBe(200);
    expect((await loginClient.login({ username: account.user.username, password: 'NewPass123!' })).status()).toBe(200);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject a consumed token without replacing the new password - 400', async ({ account }) => {
    // given
    const token = await captureLocalResetToken(account.user.username);
    expect((await resetClient.reset({ token, newPassword: 'NewPass123!', confirmPassword: 'NewPass123!' })).status()).toBe(200);

    // when
    const response = await resetClient.reset({ token, newPassword: 'AnotherPass123!', confirmPassword: 'AnotherPass123!' });

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ message: 'Invalid password reset token' });
    expect((await loginClient.login({ username: account.user.username, password: 'NewPass123!' })).status()).toBe(200);
  });
});
