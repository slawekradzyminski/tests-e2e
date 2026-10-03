import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { randomUUID } from 'node:crypto';
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import { GetTrafficInfoClient } from '../../../clients/traffic/get-traffic-info-client';

const sessionId = () => `traffic-info-${randomUUID()}`;

test.describe('GET /api/v1/traffic/info', () => {
  let client: GetTrafficInfoClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new GetTrafficInfoClient(request);
  });

  for (const role of ['admin', 'client'] as const) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken","account"]))(`should return websocket information for a ${role} - 200`, async ({ adminToken, account }) => {
      // given
      const token = role === 'admin' ? adminToken : account.token;
      const clientSessionId = sessionId();

      // when
      const response = await client.get(token, clientSessionId);

      // then
      expect(response.status()).toBe(200);
      expect(await response.json()).toMatchObject({
        webSocketEndpoint: '/api/v1/ws-traffic',
        topic: `/topic/traffic/${clientSessionId}`,
        description: expect.any(String),
      });
    });
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should reject an invalid client session header - 400', async ({ adminToken }) => {
    // given
    const invalidSessionId = 'too-short';

    // when
    const response = await client.get(adminToken, invalidSessionId);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'A valid X-Client-Session-Id header is required' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should reject a missing session header - 400', async ({ adminToken }) => {
    // given
    const clientSessionId = undefined;

    // when
    const response = await client.get(adminToken, clientSessionId);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'A valid X-Client-Session-Id header is required' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should reject missing, invalid and tampered credentials - 401', async ({ adminToken }) => {
    // given
    const clientSessionId = sessionId();

    for (const { name, token, message } of unauthorizedCases(adminToken)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.get(token, clientSessionId);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });
});
