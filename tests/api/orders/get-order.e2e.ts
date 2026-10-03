import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/commerce';
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import { GetOrderClient } from '../../../clients/orders/get-order-client';

test.describe('GET /api/v1/orders/{id}', () => {
  let detail: GetOrderClient;

  test.beforeEach(async ({ request }) => {
    // given
    detail = new GetOrderClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order"]))('should return the complete order to its owner - 200', async ({ commerce, order }) => {
    // given
    const id = order.id;

    // when
    const response = await detail.get(id, commerce.user.token);

    // then
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(order);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["order","adminToken"]))('should let an admin read a clients order - 200', async ({ order, adminToken }) => {
    // given
    const id = order.id;

    // when
    const response = await detail.get(id, adminToken);

    // then
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(order);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should reject a nonnumeric order identifier - 400', async ({ commerce }) => {
    // given
    const id = 'abc';

    // when
    const response = await detail.get(id, commerce.user.token);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'For input string: "abc"' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order"]))('should reject missing, invalid and tampered credentials - 401', async ({ commerce, order }) => {
    // given
    const token = commerce.user.token;
    for (const { name, token: rejectedToken, message } of unauthorizedCases(token)) {
      await scenarioStep(name, async () => {
        // when
        const response = await detail.get(order.id, rejectedToken);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order"]))('should hide another users order - 404', async ({ commerce, order }) => {
    // given
    const id = order.id;

    // when
    const response = await detail.get(id, commerce.other.token);

    // then
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: 'Order not found' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should return not found for a missing order - 404', async ({ commerce }) => {
    // given
    const id = -1;

    // when
    const response = await detail.get(id, commerce.user.token);

    // then
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: 'Order not found' });
  });
});
