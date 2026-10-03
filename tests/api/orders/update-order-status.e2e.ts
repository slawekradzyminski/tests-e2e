import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/commerce';
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import { UpdateOrderStatusClient } from '../../../clients/orders/update-order-status-client';
import { GetOrderClient } from '../../../clients/orders/get-order-client';
import { GetProductByIdClient } from '../../../clients/products/get-product-by-id-client';

test.describe('PUT /api/v1/orders/{id}/status', () => {
  let status: UpdateOrderStatusClient;
  let detail: GetOrderClient;
  let product: GetProductByIdClient;

  test.beforeEach(async ({ request }) => {
    // given
    status = new UpdateOrderStatusClient(request);
    detail = new GetOrderClient(request);
    product = new GetProductByIdClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order","adminToken"]))('should persist payment shipping and delivery as admin - 200', async ({ commerce, order, adminToken }) => {
    // given
    const id = order.id;

    for (const next of ['PAID', 'SHIPPED', 'DELIVERED'] as const) {
      await scenarioStep(`Transition to ${next}`, async () => {
        // when
        const response = await status.update(id, next, adminToken);

        // then
        expect(response.status()).toBe(200);
        expect(await response.json()).toMatchObject({ id, status: next, totalAmount: order.totalAmount });
        const stored = await detail.get(id, commerce.user.token);
        expect(stored.status()).toBe(200);
        expect((await stored.json()).status).toBe(next);
      });
    }
    const storedProduct = await product.get(commerce.product.id, commerce.user.token);
    expect(storedProduct.status()).toBe(200);
    expect((await storedProduct.json()).stockQuantity).toBe(3);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order","adminToken"]))('should restore stock when admin sets cancelled - 200', async ({ commerce, order, adminToken }) => {
    // given
    const id = order.id;

    // when
    const response = await status.update(id, 'CANCELLED', adminToken);

    // then
    expect(response.status()).toBe(200);
    expect((await response.json()).status).toBe('CANCELLED');
    expect((await (await detail.get(id, commerce.user.token)).json()).status).toBe('CANCELLED');
    const storedProduct = await product.get(commerce.product.id, commerce.user.token);
    expect(storedProduct.status()).toBe(200);
    expect((await storedProduct.json()).stockQuantity).toBe(5);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order","adminToken"]))('should reject cancellation after delivery without changing stock - 400', async ({ commerce, order, adminToken }) => {
    // given
    expect((await status.update(order.id, 'DELIVERED', adminToken)).status()).toBe(200);

    // when
    const response = await status.update(order.id, 'CANCELLED', adminToken);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ message: 'Order cannot be cancelled in current status' });
    const storedProduct = await product.get(commerce.product.id, commerce.user.token);
    expect(storedProduct.status()).toBe(200);
    expect((await storedProduct.json()).stockQuantity).toBe(3);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order"]))('should reject missing, invalid and tampered credentials - 401', async ({ commerce, order }) => {
    // given
    const token = commerce.user.token;
    for (const { name, token: rejectedToken, message } of unauthorizedCases(token)) {
      await scenarioStep(name, async () => {
        // when
        const response = await status.update(order.id, 'PAID', rejectedToken);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order"]))('should forbid clients from changing their own order status - 403', async ({ commerce, order }) => {
    // given
    const id = order.id;

    // when
    const response = await status.update(id, 'PAID', commerce.user.token);

    // then
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ message: 'Access denied' });
    expect(await (await detail.get(id, commerce.user.token)).json()).toEqual(order);
    const storedProduct = await product.get(commerce.product.id, commerce.user.token);
    expect(storedProduct.status()).toBe(200);
    expect((await storedProduct.json()).stockQuantity).toBe(3);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should return not found for a missing order - 404', async ({ adminToken }) => {
    // given
    const id = -1;

    // when
    const response = await status.update(id, 'PAID', adminToken);

    // then
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: 'Order not found' });
  });
});
