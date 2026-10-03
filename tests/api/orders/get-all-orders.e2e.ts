import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/commerce';
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import { GetAllOrdersClient } from '../../../clients/orders/get-all-orders-client';

test.describe('GET /api/v1/orders/admin', () => {
  let all: GetAllOrdersClient;

  test.beforeEach(async ({ request }) => {
    // given
    all = new GetAllOrdersClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["order","adminToken"]))('should list orders with pagination and status filtering - 200', async ({ order, adminToken }) => {
    // given
    const id = order.id;

    // when
    const response = await all.get(adminToken, { page: 0, size: 100, status: 'PENDING' });

    // then
    expect(response.status()).toBe(200);
    const body = await response.json();
    const collected = [...body.content];
    for (let page = 1; page < body.totalPages; page++) {
      const next = await all.get(adminToken, { page, size: 100, status: 'PENDING' });
      expect(next.status()).toBe(200);
      const pageBody = await next.json();
      expect(pageBody.pageNumber).toBe(page);
      expect(pageBody.content.every((item: { status: string }) => item.status === 'PENDING')).toBe(true);
      collected.push(...pageBody.content);
    }
    expect(collected).toContain(expect.objectContaining(order));
    expect(body.pageNumber).toBe(0);
    expect(body.pageSize).toBe(100);
    expect(body.content.every((item: { status: string }) => item.status === 'PENDING')).toBe(true);
    expect(collected.some((item: { id: number }) => item.id === id)).toBe(true);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should reject a negative page - 400', async ({ adminToken }) => {
    // given
    const token = adminToken;

    // when
    const response = await all.get(token, { page: -1 });

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'Page index must not be less than zero' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should reject a zero page size - 400', async ({ adminToken }) => {
    // given
    const token = adminToken;

    // when
    const response = await all.get(token, { size: 0 });

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'Page size must not be less than one' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should reject missing, invalid and tampered credentials - 401', async ({ commerce }) => {
    // given
    const token = commerce.user.token;
    for (const { name, token: rejectedToken, message } of unauthorizedCases(token)) {
      await scenarioStep(name, async () => {
        // when
        const response = await all.get(rejectedToken);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should forbid clients from listing all orders - 403', async ({ commerce }) => {
    // given
    const token = commerce.user.token;

    // when
    const response = await all.get(token);

    // then
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ message: 'Access denied' });
  });
});
