import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { LogoutClient } from '../../../clients/users/logout-client';
import { RefreshClient } from '../../../clients/users/refresh-client';
import { LoginClient } from '../../../clients/users/login-client';
import { unauthorizedCases } from '../test-data/unauthorized-cases';

test.describe('POST /api/v1/users/logout', () => {
  let client: LogoutClient;
  let refreshClient: RefreshClient;
  let loginClient: LoginClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new LogoutClient(request);
    refreshClient = new RefreshClient(request);
    loginClient = new LoginClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should revoke refresh tokens from every session - 200', async ({ account }) => {
    // given
    const { token, refreshToken, user } = account;
    const secondLogin = await loginClient.login({ username: user.username, password: user.password });
    expect(secondLogin.status()).toBe(200);
    const secondSession = await secondLogin.json();
    expect(secondSession.refreshToken).toEqual(expect.stringMatching(/\S+/));
    expect(secondSession.refreshToken).not.toBe(refreshToken);

    // when
    const response = await client.logout(token);

    // then
    expect(response.status()).toBe(200);
    expect(await response.text()).toBe('');
    for (const value of [refreshToken, secondSession.refreshToken]) {
      const refresh = await refreshClient.refresh(value);
      expect(refresh.status()).toBe(401);
      expect(await refresh.json()).toEqual({ message: 'Invalid refresh token' });
    }
    const newLogin = await loginClient.login({ username: user.username, password: user.password });
    expect(newLogin.status()).toBe(200);
    const newSession = await newLogin.json();
    expect((await refreshClient.refresh(newSession.refreshToken)).status()).toBe(200);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject unauthorized requests - 401', async ({ account }) => {
    // given
    const cases = unauthorizedCases(account.token);

    for (const { name, token, message } of cases) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.logout(token);

        // then
        expect.soft(response.status()).toBe(401);
        expect.soft(await response.json()).toEqual({ message });
      });
    }
    const refresh = await refreshClient.refresh(account.refreshToken);
    expect(refresh.status(), 'Unauthorized logout must not revoke the session').toBe(200);
  });
});
