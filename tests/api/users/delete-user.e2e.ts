import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { randomUUID } from 'node:crypto';
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { DeleteUserClient } from '../../../clients/users/delete-user-client';
import { UserByUsernameClient } from '../../../clients/users/user-by-username-client';
import { RefreshClient } from '../../../clients/users/refresh-client';
import { unauthorizedCases } from '../test-data/unauthorized-cases';

test.describe('DELETE /api/v1/users/{username}', () => {
  let client: DeleteUserClient;
  let userClient: UserByUsernameClient;
  let refreshClient: RefreshClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new DeleteUserClient(request);
    userClient = new UserByUsernameClient(request);
    refreshClient = new RefreshClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken","account"]))('should allow an administrator to delete an account and revoke its refresh session - 204', async ({ adminToken, account }) => {
    // given
    const username = account.user.username;

    // when
    const response = await client.deleteUser(username, adminToken);

    // then
    expect(response.status()).toBe(204);
    expect(await response.text()).toBe('');
    const deleted = await userClient.getByUsername(username, adminToken);
    expect(deleted.status()).toBe(404);
    expect(await deleted.json()).toEqual({ message: "The user doesn't exist" });
    const revoked = await refreshClient.refresh(account.refreshToken);
    expect(revoked.status()).toBe(401);
    expect(await revoked.json()).toEqual({ message: 'Invalid refresh token' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account","adminToken"]))('should reject missing, invalid and tampered credentials without deletion - 401', async ({ account, adminToken }) => {
    // given
    const username = account.user.username;

    for (const { name, token, message } of unauthorizedCases(account.token)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.deleteUser(username, token);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
    const unchanged = await userClient.getByUsername(username, adminToken);
    expect(unchanged.status()).toBe(200);
    expect((await unchanged.json()).username).toBe(username);
  });

  for (const target of ['self', 'another account'] as const) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account","createAccount","adminToken"]))(`should forbid a client deleting ${target} through the administrator endpoint - 403`, async ({ account, createAccount, adminToken }) => {
      // given
      const owner = target === 'self' ? account : await createAccount();

      // when
      const response = await client.deleteUser(owner.user.username, account.token);

      // then
      expect(response.status()).toBe(403);
      expect(await response.json()).toEqual({ message: 'Access denied' });
      const unchanged = await userClient.getByUsername(owner.user.username, adminToken);
      expect(unchanged.status()).toBe(200);
      expect((await unchanged.json()).username).toBe(owner.user.username);
    });
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should return not found for a missing account - 404', async ({ adminToken }) => {
    // given
    const username = `missing-delete-${randomUUID()}`;

    // when
    const response = await client.deleteUser(username, adminToken);

    // then
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: "The user doesn't exist" });
  });
});
