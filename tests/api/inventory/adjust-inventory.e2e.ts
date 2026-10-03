import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { randomUUID } from 'node:crypto';
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/inventory';
import { AdjustInventoryClient } from '../../../clients/inventory/adjust-inventory-client';
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import { ListInventoryMovementsClient } from '../../../clients/inventory/list-inventory-movements-client';
import { GetInventoryClient } from '../../../clients/inventory/get-inventory-client';
import { GetProductByIdClient } from '../../../clients/products/get-product-by-id-client';
import type { InventoryMovementDto } from '../../../types/inventory';
import { ADMIN_USERNAME } from '../../../test-config';

test.describe('POST /api/v1/admin/inventory/{productId}/adjustments', () => {
  let client: AdjustInventoryClient;
  let movementsClient: ListInventoryMovementsClient;
  let inventoryClient: GetInventoryClient;
  let productClient: GetProductByIdClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new AdjustInventoryClient(request);
    movementsClient = new ListInventoryMovementsClient(request);
    inventoryClient = new GetInventoryClient(request);
    productClient = new GetProductByIdClient(request);
  });

  async function readState(productId: number, token: string) {
    const inventory = await inventoryClient.get(productId, token);
    const product = await productClient.get(productId, token);
    const movements = await movementsClient.list(productId, token);
    expect(inventory.status()).toBe(200);
    expect(product.status()).toBe(200);
    expect(movements.status()).toBe(200);
    return {
      inventory: await inventory.json(),
      product: await product.json(),
      movements: await movements.json(),
    };
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","adminToken"]))('should apply an adjustment once when the request is repeated - 201', async ({ inventoryProduct, adminToken }) => {
    // given
    const product = inventoryProduct;
    const payload = { delta: 2, reason: 'inventory test adjustment', requestId: randomUUID() };

    // when
    const firstResponse = await client.adjust(product.id, payload, adminToken);
    expect(firstResponse.status()).toBe(201);
    const first = await firstResponse.json();
    const repeatResponse = await client.adjust(product.id, payload, adminToken);
    const repeat = await repeatResponse.json();

    // then
    expect(first).toEqual(expect.objectContaining({
      productId: product.id,
      type: 'ADMIN_ADJUSTMENT',
      delta: payload.delta,
      quantityAfter: product.stockQuantity + payload.delta,
      actor: ADMIN_USERNAME,
      reason: payload.reason,
      requestId: payload.requestId,
      id: expect.any(Number),
      createdAt: expect.any(String),
    }));
    expect(repeatResponse.status()).toBe(201);
    expect(repeat).toEqual(first);

    const historyResponse = await movementsClient.list(product.id, adminToken);
    expect(historyResponse.status()).toBe(200);
    const history = await historyResponse.json();
    expect(history.content.filter((movement: InventoryMovementDto) => movement.requestId === payload.requestId)).toHaveLength(1);
    expect(history.content[0]).toEqual(expect.objectContaining({ requestId: payload.requestId, type: 'ADMIN_ADJUSTMENT' }));

    const inventoryResponse = await inventoryClient.get(product.id, adminToken);
    expect(inventoryResponse.status()).toBe(200);
    expect(await inventoryResponse.json()).toEqual(expect.objectContaining({ availableQuantity: product.stockQuantity + payload.delta }));
    const productResponse = await productClient.get(product.id, adminToken);
    expect(productResponse.status()).toBe(200);
    expect((await productResponse.json()).stockQuantity).toBe(product.stockQuantity + payload.delta);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","adminToken"]))('should allow a negative adjustment down to zero stock - 201', async ({ inventoryProduct, adminToken }) => {
    // given
    const payload = { delta: -inventoryProduct.stockQuantity, reason: 'Deplete stock', requestId: randomUUID() };

    // when
    const response = await client.adjust(inventoryProduct.id, payload, adminToken);

    // then
    expect(response.status()).toBe(201);
    expect(await response.json()).toMatchObject({ delta: -5, quantityAfter: 0, requestId: payload.requestId });
    const state = await readState(inventoryProduct.id, adminToken);
    expect(state.inventory).toMatchObject({ availableQuantity: 0, stockStatus: 'OUT_OF_STOCK' });
    expect(state.product.stockQuantity).toBe(0);
    expect(state.movements.content).toHaveLength(2);
    expect(state.movements.content[0]).toMatchObject({ type: 'ADMIN_ADJUSTMENT', delta: -5, quantityAfter: 0 });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","adminToken"]))('should reject a zero delta - 400', async ({ inventoryProduct, adminToken }) => {
    // given
    const payload = { delta: 0, reason: 'invalid', requestId: randomUUID() };
    const before = await readState(inventoryProduct.id, adminToken);

    // when
    const response = await client.adjust(inventoryProduct.id, payload, adminToken);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ deltaNonZero: 'delta must not be zero' });
    expect(await readState(inventoryProduct.id, adminToken)).toEqual(before);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","adminToken"]))('should reject a request without requestId - 400', async ({ inventoryProduct, adminToken }) => {
    // given
    const payload = { delta: 1, reason: 'invalid' };
    const before = await readState(inventoryProduct.id, adminToken);

    // when
    const response = await client.adjust(inventoryProduct.id, payload, adminToken);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ requestId: 'must not be null' });
    expect(await readState(inventoryProduct.id, adminToken)).toEqual(before);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","adminToken"]))('should reject unauthenticated requests - 401', async ({ inventoryProduct, adminToken }) => {
    // given
    const payload = { delta: 1, reason: 'unauthorized', requestId: randomUUID() };
    const before = await readState(inventoryProduct.id, adminToken);
    for (const { name, token, message } of unauthorizedCases(adminToken)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.adjust(inventoryProduct.id, payload, token);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
    expect(await readState(inventoryProduct.id, adminToken)).toEqual(before);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","account","adminToken"]))('should forbid a regular client - 403', async ({ inventoryProduct, account, adminToken }) => {
    // given
    const payload = { delta: 1, reason: 'forbidden', requestId: randomUUID() };
    const before = await readState(inventoryProduct.id, adminToken);

    // when
    const response = await client.adjust(inventoryProduct.id, payload, account.token);

    // then
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ message: 'Access denied' });
    expect(await readState(inventoryProduct.id, adminToken)).toEqual(before);
  });


  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should reject an adjustment for a missing product - 404', async ({ adminToken }) => {
    // given
    const payload = { delta: 1, reason: 'Missing product', requestId: randomUUID() };

    // when
    const response = await client.adjust(-1, payload, adminToken);

    // then
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: 'Product not found' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","adminToken"]))('should reject stock underflow without recording a movement - 409', async ({ inventoryProduct, adminToken }) => {
    // given
    const before = await readState(inventoryProduct.id, adminToken);
    const payload = { delta: -6, reason: 'Underflow', requestId: randomUUID() };

    // when
    const response = await client.adjust(inventoryProduct.id, payload, adminToken);

    // then
    expect(response.status()).toBe(409);
    expect(await response.json()).toEqual({ message: 'Insufficient stock' });
    expect(await readState(inventoryProduct.id, adminToken)).toEqual(before);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","adminToken"]))('should reject a reused requestId with a different payload without mutation - 409', async ({ inventoryProduct, adminToken }) => {
    // given
    const payload = { delta: 2, reason: 'Original adjustment', requestId: randomUUID() };
    expect((await client.adjust(inventoryProduct.id, payload, adminToken)).status()).toBe(201);
    const before = await readState(inventoryProduct.id, adminToken);

    // when
    const response = await client.adjust(inventoryProduct.id, { ...payload, delta: 3 }, adminToken);

    // then
    expect(response.status()).toBe(409);
    expect(await response.json()).toEqual({ message: 'requestId already used with different payload' });
    expect(await readState(inventoryProduct.id, adminToken)).toEqual(before);
  });
});
