import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { randomUUID } from 'node:crypto';
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { UpdateUserClient } from '../../../clients/users/update-user-client';
import { LoginClient } from '../../../clients/users/login-client';
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import { CurrentUserClient } from '../../../clients/users/current-user-client';

test.describe('PUT /api/v1/users/{username}', () => {
  let client: UpdateUserClient;
  let currentUserClient: CurrentUserClient;
  let loginClient: LoginClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new UpdateUserClient(request);
    currentUserClient = new CurrentUserClient(request);
    loginClient = new LoginClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should update the owner profile without changing privileges - 200', async ({ account }) => {
    // given
    const data = {
      email: `updated-${randomUUID()}@example.com`,
      firstName: 'UpdatedFirst',
      lastName: 'UpdatedLast',
      roles: ['ROLE_ADMIN'],
      password: 'InjectedPassword123!',
    };

    // when
    const response = await client.update(account.user.username, data, account.token);

    // then
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.roles).toEqual(['ROLE_CLIENT']);
    expect(body.firstName).toBe(data.firstName);
    expect(body.lastName).toBe(data.lastName);
    expect(Object.keys(body)).not.toContain('password');
    expect(Object.keys(body)).not.toContain('passwordHash');
    expect(Object.keys(body)).not.toContain('hash');
    const current = await currentUserClient.getMe(account.token);
    expect(current.status()).toBe(200);
    expect(await current.json()).toMatchObject({ email: data.email, firstName: data.firstName, lastName: data.lastName, roles: ['ROLE_CLIENT'] });
    expect((await loginClient.login({ username: account.user.username, password: account.user.password })).status()).toBe(200);
    expect((await loginClient.login({ username: account.user.username, password: data.password })).status()).toBe(422);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken","createAccount"]))('should allow an administrator to edit another account - 200', async ({ adminToken, createAccount }) => {
    // given
    const other = await createAccount();

    // when
    const response = await client.update(other.user.username, {
      email: other.user.email,
      firstName: 'AdminFirst',
      lastName: 'AdminLast',
    }, adminToken);

    // then
    expect(response.status()).toBe(200);
    expect((await response.json()).firstName).toBe('AdminFirst');
    const persisted = await currentUserClient.getMe(other.token);
    expect(persisted.status()).toBe(200);
    expect(await persisted.json()).toMatchObject({ firstName: 'AdminFirst', lastName: 'AdminLast' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject invalid profile fields without changing the profile - 400', async ({ account }) => {
    // given
    const original = await currentUserClient.getMe(account.token);
    expect(original.status()).toBe(200);
    const originalBody = await original.json();

    // when
    const response = await client.update(account.user.username, {
      email: account.user.email,
      firstName: 'A',
      lastName: 'B',
    }, account.token);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      firstName: 'Minimum firstName length: 4 characters',
      lastName: 'Minimum lastName length: 4 characters',
    });
    const unchanged = await currentUserClient.getMe(account.token);
    expect(unchanged.status()).toBe(200);
    expect(await unchanged.json()).toEqual(originalBody);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject missing, invalid and tampered credentials without mutation - 401', async ({ account }) => {
    // given
    const payload = { email: account.user.email, firstName: 'UnauthorizedChange' };

    for (const { name, token, message } of unauthorizedCases(account.token)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.update(account.user.username, payload, token);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
    const unchanged = await currentUserClient.getMe(account.token);
    expect(unchanged.status()).toBe(200);
    expect(await unchanged.json()).toMatchObject({ email: account.user.email, firstName: account.user.firstName });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account","createAccount"]))('should reject a client editing another account - 403', async ({ account, createAccount }) => {
    // given
    const other = await createAccount();

    // when
    const response = await client.update(other.user.username, {
      email: `blocked-${other.user.email}`,
      firstName: 'BlockedName',
      lastName: 'BlockedName',
    }, account.token);

    // then
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ message: 'Access denied' });
    const unchanged = await currentUserClient.getMe(other.token);
    expect(unchanged.status()).toBe(200);
    expect(await unchanged.json()).toMatchObject({
      email: other.user.email,
      firstName: other.user.firstName,
      lastName: other.user.lastName,
    });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should return not found for a missing account - 404', async ({ adminToken }) => {
    // given
    const missing = `missing-profile-${randomUUID()}`;

    // when
    const response = await client.update(missing, {
      email: `${missing}@example.com`,
    }, adminToken);

    // then
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: "The user doesn't exist" });
  });
});
