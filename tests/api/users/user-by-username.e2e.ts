import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { UserByUsernameClient } from '../../../clients/users/user-by-username-client';
import { UserGenerator } from '../../../generators/user-generator';
import { expectRegisteredUser } from '../../../validators/user-response-validator';
import { unauthorizedCases } from '../test-data/unauthorized-cases';

test.describe('GET /api/v1/users/{username}', () => {
  let client: UserByUsernameClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new UserByUsernameClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should return the requested account - 200', async ({ account }) => {
    // given
    const { token, user } = account;

    // when
    const response = await client.getByUsername(user.username, token);

    // then
    expect(response.status()).toBe(200);
    expectRegisteredUser(await response.json(), user);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject unauthorized requests - 401', async ({ account }) => {
    // given
    const cases = unauthorizedCases(account.token);

    for (const { name, token, message } of cases) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.getByUsername(account.user.username, token);

        // then
        expect.soft(response.status()).toBe(401);
        expect.soft(await response.json()).toEqual({ message });
      });
    }
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should report an unknown username - 404', async ({ account }) => {
    // given
    const username = UserGenerator.generate().username;

    // when
    const response = await client.getByUsername(username, account.token);

    // then
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: "The user doesn't exist" });
  });
});
