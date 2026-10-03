import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/commerce';
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import { CancelOrderClient } from '../../../clients/orders/cancel-order-client';
import { GetOrderClient } from '../../../clients/orders/get-order-client';
import { GetProductByIdClient } from '../../../clients/products/get-product-by-id-client';
import { UpdateOrderStatusClient } from '../../../clients/orders/update-order-status-client';

test.describe('POST /api/v1/orders/{id}/cancel', () => {
  let cancel: CancelOrderClient;
  let detail: GetOrderClient;
  let product: GetProductByIdClient;
  let status: UpdateOrderStatusClient;

  test.beforeEach(async ({ request }) => {
    // given
    cancel = new CancelOrderClient(request);
    detail = new GetOrderClient(request);
    product = new GetProductByIdClient(request);
    status = new UpdateOrderStatusClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order"]))('should cancel an owned order and restore stock - 200', async ({ commerce, order }) => {
    // given
    const id = order.id;

    // when
    const response = await cancel.cancel(id, commerce.user.token);

    // then
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ ...order, status: 'CANCELLED', updatedAt: expect.any(String) });
    expect((await (await detail.get(id, commerce.user.token)).json()).status).toBe('CANCELLED');
    const storedProduct = await product.get(commerce.product.id, commerce.user.token);
    expect(storedProduct.status()).toBe(200);
    expect((await storedProduct.json()).stockQuantity).toBe(5);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order","adminToken"]))('should allow admin cancellation of a clients order - 200', async ({ commerce, order, adminToken }) => {
    // given
    const id = order.id;

    // when
    const response = await cancel.cancel(id, adminToken);

    // then
    expect(response.status()).toBe(200);
    expect((await response.json()).status).toBe('CANCELLED');
    const storedProduct = await product.get(commerce.product.id, commerce.user.token);
    expect(storedProduct.status()).toBe(200);
    expect((await storedProduct.json()).stockQuantity).toBe(5);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order"]))('should reject repeated cancellation without restoring stock twice - 400', async ({ commerce, order }) => {
    // given
    expect((await cancel.cancel(order.id, commerce.user.token)).status()).toBe(200);

    // when
    const response = await cancel.cancel(order.id, commerce.user.token);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ message: 'Order cannot be cancelled in current status' });
    const storedProduct = await product.get(commerce.product.id, commerce.user.token);
    expect(storedProduct.status()).toBe(200);
    expect((await storedProduct.json()).stockQuantity).toBe(5);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order","adminToken"]))('should reject cancellation after shipping - 400', async ({ commerce, order, adminToken }) => {
    // given
    expect((await status.update(order.id, 'SHIPPED', adminToken)).status()).toBe(200);

    // when
    const response = await cancel.cancel(order.id, commerce.user.token);

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
        const response = await cancel.cancel(order.id, rejectedToken);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","order"]))('should reject cancellation by another client without changing order - 403', async ({ commerce, order }) => {
    // given
    const id = order.id;

    // when
    const response = await cancel.cancel(id, commerce.other.token);

    // then
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ message: "You cannot cancel someone else's order" });
    expect(await (await detail.get(id, commerce.user.token)).json()).toEqual(order);
    const storedProduct = await product.get(commerce.product.id, commerce.user.token);
    expect(storedProduct.status()).toBe(200);
    expect((await storedProduct.json()).stockQuantity).toBe(3);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should return not found for a missing order - 404', async ({ commerce }) => {
    // given
    const id = -1;

    // when
    const response = await cancel.cancel(id, commerce.user.token);

    // then
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: 'Order not found' });
  });
});
