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
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import type { TrafficPageDto } from '../../../types/traffic';

test.describe('GET /api/v1/traffic/logs', () => {
  let infoClient: GetTrafficInfoClient;
  let client: GetTrafficLogsClient;

  test.beforeEach(async ({ request }) => {
    // given
    infoClient = new GetTrafficInfoClient(request);
    client = new GetTrafficLogsClient(request);
  });

  for (const role of ['admin', 'client'] as const) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken","account"]))(`should filter and paginate the isolated session as ${role} - 200`, async ({ adminToken, account }) => {
      // given
      const token = role === 'admin' ? adminToken : account.token;
      const sessionId = `traffic-logs-${randomUUID()}`;
      for (let index = 0; index < 3; index++) {
        expect((await infoClient.get(token, sessionId)).status()).toBe(200);
      }
      await expect.poll(async () => {
        const response = await client.get(token, sessionId);
        expect(response.status()).toBe(200);
        return (await response.json()).totalElements;
      }, { timeout: 5000, interval: 100 }).toBe(3);
      const query = { size: 2, method: 'GET', status: 200, pathContains: '/traffic/info' };

      // when
      const firstResponse = await client.get(token, sessionId, { ...query, page: 0 });
      const secondResponse = await client.get(token, sessionId, { ...query, page: 1 });

      // then
      expect(firstResponse.status()).toBe(200);
      expect(secondResponse.status()).toBe(200);
      const first: TrafficPageDto = await firstResponse.json();
      const second: TrafficPageDto = await secondResponse.json();
      expect(first).toMatchObject({ pageNumber: 0, pageSize: 2, totalElements: 3, totalPages: 2 });
      expect(second).toMatchObject({ pageNumber: 1, pageSize: 2, totalElements: 3, totalPages: 2 });
      expect(first.content).toHaveLength(2);
      expect(second.content).toHaveLength(1);
      const entries = [...first.content, ...second.content];
      expect(new Set(entries.map((entry) => entry.correlationId)).size).toBe(3);
      for (const entry of entries) {
        expect(entry).toMatchObject({ clientSessionId: sessionId, method: 'GET', path: '/api/v1/traffic/info', status: 200 });
        expect(Number.isFinite(Date.parse(entry.timestamp))).toBe(true);
      }
      const timestamps = entries.map((entry) => Date.parse(entry.timestamp));
      expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
    });
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should exclude captured traffic when a filter does not match - 200', async ({ adminToken }) => {
    // given
    const sessionId = `traffic-filter-${randomUUID()}`;
    expect((await infoClient.get(adminToken, sessionId)).status()).toBe(200);
    await expect.poll(async () => {
      const response = await client.get(adminToken, sessionId);
      expect(response.status()).toBe(200);
      return (await response.json()).totalElements;
    }, { timeout: 5000, interval: 100 }).toBe(1);

    for (const query of [{ method: 'POST' }, { status: 404 }, { pathContains: '/no-such-route' }, { text: randomUUID() }]) {
      // when
      const response = await client.get(adminToken, sessionId, query);

      // then
      expect(response.status()).toBe(200);
      expect(await response.json()).toMatchObject({ content: [], totalElements: 0, totalPages: 0 });
    }
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should clamp both page size boundaries - 200', async ({ adminToken }) => {
    // given
    const sessionId = `traffic-size-${randomUUID()}`;

    for (const { size, expected } of [{ size: 0, expected: 1 }, { size: 101, expected: 100 }]) {
      // when
      const response = await client.get(adminToken, sessionId, { size });

      // then
      expect(response.status()).toBe(200);
      expect((await response.json()).pageSize).toBe(expected);
    }
  });

  const invalidQueries = [
    { name: 'negative page', query: { page: -1 }, error: 'Page index must not be less than zero' },
    { name: 'invalid lower timestamp', query: { from: 'bad' }, error: 'Invalid instant format: bad' },
    { name: 'invalid upper timestamp', query: { to: 'bad' }, error: 'Invalid instant format: bad' },
  ];

  for (const { name, query, error } of invalidQueries) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))(`should reject ${name} - 400`, async ({ adminToken }) => {
      // given
      const sessionId = `traffic-invalid-${randomUUID()}`;

      // when
      const response = await client.get(adminToken, sessionId, query);

      // then
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ error });
    });
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should require a valid session header - 400', async ({ adminToken }) => {
    // given
    const sessionId = undefined;

    // when
    const response = await client.get(adminToken, sessionId);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'A valid X-Client-Session-Id header is required' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should reject missing, invalid and tampered credentials - 401', async ({ adminToken }) => {
    // given
    const sessionId = `traffic-auth-${randomUUID()}`;

    for (const { name, token, message } of unauthorizedCases(adminToken)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.get(token, sessionId);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });
});
