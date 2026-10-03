import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { randomUUID } from 'node:crypto';
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { RightToBeForgottenClient } from '../../../clients/users/right-to-be-forgotten-client';
import { UserByUsernameClient } from '../../../clients/users/user-by-username-client';
import { RefreshClient } from '../../../clients/users/refresh-client';
import { ForgotPasswordClient } from '../../../clients/users/forgot-password-client';
import { ResetPasswordClient } from '../../../clients/users/reset-password-client';
import { unauthorizedCases } from '../test-data/unauthorized-cases';

test.describe('DELETE /api/v1/users/{username}/right-to-be-forgotten', () => {
  let client: RightToBeForgottenClient;
  let userClient: UserByUsernameClient;
  let refreshClient: RefreshClient;
  let forgotClient: ForgotPasswordClient;
  let resetClient: ResetPasswordClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new RightToBeForgottenClient(request);
    userClient = new UserByUsernameClient(request);
    refreshClient = new RefreshClient(request);
    forgotClient = new ForgotPasswordClient(request);
    resetClient = new ResetPasswordClient(request);
  });

  for (const actor of ['owner', 'administrator'] as const) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account","adminToken"]))(`should let the ${actor} delete the account and invalidate refresh and reset tokens - 204`, async ({ account, adminToken }) => {
      // given
      const token = actor === 'owner' ? account.token : adminToken;
      const forgot = await forgotClient.requestReset({ identifier: account.user.username });
      expect(forgot.status()).toBe(202);
      const resetToken = (await forgot.json()).token;
      expect(resetToken, 'Local profile exposes the reset token for testing').toEqual(expect.stringMatching(/\S+/));

      // when
      const response = await client.forget(account.user.username, token);

      // then
      expect(response.status()).toBe(204);
      expect(await response.text()).toBe('');
      const deleted = await userClient.getByUsername(account.user.username, adminToken);
      expect(deleted.status()).toBe(404);
      expect(await deleted.json()).toEqual({ message: "The user doesn't exist" });
      const revoked = await refreshClient.refresh(account.refreshToken);
      expect(revoked.status()).toBe(401);
      expect(await revoked.json()).toEqual({ message: 'Invalid refresh token' });
      const reset = await resetClient.reset({ token: resetToken, newPassword: 'AfterDelete123!', confirmPassword: 'AfterDelete123!' });
      expect(reset.status()).toBe(400);
      expect(await reset.json()).toEqual({ message: 'Invalid password reset token' });
    });
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account","adminToken"]))('should reject missing, invalid and tampered credentials without deletion - 401', async ({ account, adminToken }) => {
    // given
    const username = account.user.username;

    for (const { name, token, message } of unauthorizedCases(account.token)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.forget(username, token);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
    const unchanged = await userClient.getByUsername(username, adminToken);
    expect(unchanged.status()).toBe(200);
    expect((await unchanged.json()).username).toBe(username);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account","createAccount","adminToken"]))('should reject a client forgetting another account and preserve the target - 403', async ({ account, createAccount, adminToken }) => {
    // given
    const other = await createAccount();

    // when
    const response = await client.forget(other.user.username, account.token);

    // then
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ message: 'Access denied' });
    const unchanged = await userClient.getByUsername(other.user.username, adminToken);
    expect(unchanged.status()).toBe(200);
    expect((await unchanged.json()).username).toBe(other.user.username);
    expect((await refreshClient.refresh(other.refreshToken)).status()).toBe(200);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should return not found for a missing account - 404', async ({ adminToken }) => {
    // given
    const username = `missing-forget-${randomUUID()}`;

    // when
    const response = await client.forget(username, adminToken);

    // then
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: "The user doesn't exist" });
  });
});
