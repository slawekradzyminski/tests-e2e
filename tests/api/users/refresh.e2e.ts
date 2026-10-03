import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { RefreshClient } from '../../../clients/users/refresh-client';
import { CurrentUserClient } from '../../../clients/users/current-user-client';
import { expectLoginJwt } from '../../../validators/jwt-validator';
import { expectRegisteredUser } from '../../../validators/user-response-validator';

test.describe('POST /api/v1/users/refresh', () => {
  let client: RefreshClient;
  let currentUserClient: CurrentUserClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new RefreshClient(request);
    currentUserClient = new CurrentUserClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should rotate tokens without requiring an access token - 200', async ({ account }) => {
    // given
    const { refreshToken, user } = account;

    // when
    const response = await client.refresh(refreshToken);

    // then
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ token: expect.any(String), refreshToken: expect.stringMatching(/\S+/) });
    expect(body.refreshToken).not.toBe(refreshToken);
    expectLoginJwt(body.token, user.username, ['ROLE_CLIENT']);
    const identity = await currentUserClient.getMe(body.token);
    expect(identity.status()).toBe(200);
    expectRegisteredUser(await identity.json(), user);
    const replacement = await client.refresh(body.refreshToken);
    expect(replacement.status()).toBe(200);
    const next = await replacement.json();
    expect(next.refreshToken).toEqual(expect.stringMatching(/\S+/));
    expect(next.refreshToken).not.toBe(body.refreshToken);
    expectLoginJwt(next.token, user.username, ['ROLE_CLIENT']);
  });

  const invalidBodies = [
    { name: 'missing refresh token', data: {} },
    { name: 'null refresh token', data: { refreshToken: null } },
    { name: 'empty refresh token', data: { refreshToken: '' } },
    { name: 'blank refresh token', data: { refreshToken: ' ' } },
  ];

  for (const { name, data } of invalidBodies) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, []))(`should reject ${name} - 400`, async () => {
      // given
      const payload = data;

      // when
      const response = await client.refreshRaw(payload);

      // then
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ refreshToken: 'must not be blank' });
    });
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject invalid, wrong-type and consumed tokens - 401', async ({ account }) => {
    // given
    const { refreshToken, token } = account;
    expect((await client.refresh(refreshToken)).status()).toBe(200);
    const cases = [
      { name: 'unknown token', value: 'invalid' },
      { name: 'access token used as refresh token', value: token },
      { name: 'already consumed token', value: refreshToken },
    ];

    for (const { name, value } of cases) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.refresh(value);

        // then
        expect.soft(response.status()).toBe(401);
        expect.soft(await response.json()).toEqual({ message: 'Invalid refresh token' });
      });
    }
  });
});
