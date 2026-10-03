import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { randomUUID } from 'node:crypto';
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { GetTrafficInfoClient } from '../../../clients/traffic/get-traffic-info-client';
import { GetTrafficLogsClient } from '../../../clients/traffic/get-traffic-logs-client';
import { GetTrafficLogClient } from '../../../clients/traffic/get-traffic-log-client';
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import type { TrafficLogEntryDto, TrafficPageDto } from '../../../types/traffic';

test.describe('GET /api/v1/traffic/logs/{correlationId}', () => {
  let infoClient: GetTrafficInfoClient;
  let logsClient: GetTrafficLogsClient;
  let client: GetTrafficLogClient;

  test.beforeEach(async ({ request }) => {
    // given
    infoClient = new GetTrafficInfoClient(request);
    logsClient = new GetTrafficLogsClient(request);
    client = new GetTrafficLogClient(request);
  });

  async function captureLog(token: string, sessionId: string): Promise<TrafficLogEntryDto> {
    expect((await infoClient.get(token, sessionId)).status()).toBe(200);
    let entry: TrafficLogEntryDto | undefined;
    await expect.poll(async () => {
      const response = await logsClient.get(token, sessionId, { pathContains: '/traffic/info' });
      expect(response.status()).toBe(200);
      const body: TrafficPageDto = await response.json();
      entry = body.content.find((item) => item.clientSessionId === sessionId);
      return entry?.correlationId;
    }, { timeout: 5000, interval: 100 }).toEqual(expect.stringMatching(/\S+/));
    if (!entry) throw new Error('Expected a captured traffic entry after polling');
    return entry;
  }

  for (const role of ['admin', 'client'] as const) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken","account"]))(`should return the captured log to the same session as ${role} - 200`, async ({ adminToken, account }) => {
      // given
      const token = role === 'admin' ? adminToken : account.token;
      const sessionId = `traffic-log-${randomUUID()}`;
      const entry = await captureLog(token, sessionId);

      // when
      const response = await client.get(entry.correlationId, token, sessionId);

      // then
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual(entry);
    });
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should require a valid session header - 400', async ({ adminToken }) => {
    // given
    const correlationId = randomUUID();

    // when
    const response = await client.get(correlationId, adminToken);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'A valid X-Client-Session-Id header is required' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should reject missing, invalid and tampered credentials - 401', async ({ adminToken }) => {
    // given
    const correlationId = randomUUID();
    const sessionId = `traffic-auth-${randomUUID()}`;

    for (const { name, token, message } of unauthorizedCases(adminToken)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.get(correlationId, token, sessionId);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should hide an existing correlation from another session - 404', async ({ adminToken }) => {
    // given
    const sessionId = `traffic-owner-${randomUUID()}`;
    const entry = await captureLog(adminToken, sessionId);
    const otherSessionId = `traffic-other-${randomUUID()}`;
    expect((await client.get(entry.correlationId, adminToken, sessionId)).status()).toBe(200);

    // when
    const response = await client.get(entry.correlationId, adminToken, otherSessionId);

    // then
    expect(response.status()).toBe(404);
    expect(await response.text()).toBe('');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should return an empty not-found response for an unknown correlation - 404', async ({ adminToken }) => {
    // given
    const sessionId = `traffic-unknown-${randomUUID()}`;
    const correlationId = randomUUID();

    // when
    const response = await client.get(correlationId, adminToken, sessionId);

    // then
    expect(response.status()).toBe(404);
    expect(await response.text()).toBe('');
  });
});
