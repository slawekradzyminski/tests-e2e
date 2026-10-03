import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { CurrentUserClient } from '../../../clients/users/current-user-client';
import { expectRegisteredUser } from '../../../validators/user-response-validator';

test.describe('/api/v1/users/me API tests', () => {
  let client: CurrentUserClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new CurrentUserClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should return registered user details - 200', async ({ account }) => {
    // given
    const { token, user } = account;

    // when
    const response = await client.getMe(token);

    // then
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    expectRegisteredUser(await response.json(), user);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject unauthorized requests - 401', async ({ account }) => {
    // given
    const cases = unauthorizedCases(account.token);

    for (const { name, token, message } of cases) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.getMe(token);

        // then
        expect.soft(response.status()).toBe(401);
        expect.soft(await response.json()).toEqual({ message });
      });
    }
  });
});
