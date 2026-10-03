import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { shippingAddress, fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/commerce';
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import { GetOrdersClient } from '../../../clients/orders/get-orders-client';

import { AddCartItemClient } from '../../../clients/cart/add-cart-item-client';
import { CreateOrderClient } from '../../../clients/orders/create-order-client';
import { CancelOrderClient } from '../../../clients/orders/cancel-order-client';

test.describe('GET /api/v1/orders', () => {
  let orders: GetOrdersClient;
  let add: AddCartItemClient;
  let create: CreateOrderClient;
  let cancel: CancelOrderClient;

  test.beforeEach(async ({ request }) => {
    // given
    orders = new GetOrdersClient(request);
    add = new AddCartItemClient(request);
    create = new CreateOrderClient(request);
    cancel = new CancelOrderClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order"]))('should list orders with pagination and status filtering - 200', async ({ commerce, order }) => {
    // given
    const id = order.id;

    // when
    const response = await orders.get(commerce.user.token, { page: 0, size: 100, status: 'PENDING' });

    // then
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ content: [order], pageNumber: 0, pageSize: 100, totalElements: 1, totalPages: 1 });
    const other = await orders.get(commerce.other.token);
    expect((await other.json()).content).toEqual([]);
    expect(body.content.every((item: { status: string }) => item.status === 'PENDING')).toBe(true);
    expect(body.content.some((item: { id: number }) => item.id === id)).toBe(true);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order"]))('should paginate two orders and exclude cancelled orders from pending results - 200', async ({ commerce, order }) => {
    // given
    expect((await add.add({ productId: commerce.product.id, quantity: 1 }, commerce.user.token)).status()).toBe(200);
    const created = await create.create(shippingAddress, commerce.user.token);
    expect(created.status()).toBe(201);
    const second = await created.json();
    expect((await cancel.cancel(second.id, commerce.user.token)).status()).toBe(200);

    // when
    const firstPage = await orders.get(commerce.user.token, { page: 0, size: 1 });
    const secondPage = await orders.get(commerce.user.token, { page: 1, size: 1 });
    const filtered = await orders.get(commerce.user.token, { status: 'PENDING' });

    // then
    expect(firstPage.status()).toBe(200);
    expect(secondPage.status()).toBe(200);
    expect(filtered.status()).toBe(200);
    const firstBody = await firstPage.json();
    const secondBody = await secondPage.json();
    expect(firstBody).toMatchObject({ pageNumber: 0, pageSize: 1, totalElements: 2, totalPages: 2 });
    expect(secondBody).toMatchObject({ pageNumber: 1, pageSize: 1, totalElements: 2, totalPages: 2 });
    expect(firstBody.content).toHaveLength(1);
    expect(secondBody.content).toHaveLength(1);
    expect([firstBody.content[0].id, secondBody.content[0].id].sort((a, b) => a - b)).toEqual([order.id, second.id].sort((a, b) => a - b));
    expect(await filtered.json()).toMatchObject({ content: [order], totalElements: 1 });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should reject a negative page - 400', async ({ commerce }) => {
    // given
    const token = commerce.user.token;

    // when
    const response = await orders.get(token, { page: -1 });

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'Page index must not be less than zero' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should reject a zero page size - 400', async ({ commerce }) => {
    // given
    const token = commerce.user.token;

    // when
    const response = await orders.get(token, { size: 0 });

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
        const response = await orders.get(rejectedToken);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });
});
