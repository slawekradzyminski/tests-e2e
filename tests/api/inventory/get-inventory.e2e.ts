import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/inventory';
import { GetInventoryClient } from '../../../clients/inventory/get-inventory-client';
import { unauthorizedCases } from '../test-data/unauthorized-cases';

test.describe('GET /api/v1/admin/inventory/{productId}', () => {
  let client: GetInventoryClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new GetInventoryClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","adminToken"]))('should return the fixture product stock - 200', async ({ inventoryProduct, adminToken }) => {
    // given
    const product = inventoryProduct;

    // when
    const response = await client.get(product.id, adminToken);

    // then
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({
      productId: product.id,
      name: product.name,
      category: product.category,
      availableQuantity: 5,
      stockStatus: 'LOW_STOCK',
      lastChangedAt: expect.any(String),
    }));
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","adminToken"]))('should classify stock above a custom threshold - 200', async ({ inventoryProduct, adminToken }) => {
    // given
    const threshold = 4;

    // when
    const response = await client.get(inventoryProduct.id, adminToken, threshold);

    // then
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ availableQuantity: 5, stockStatus: 'IN_STOCK' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","adminToken"]))('should reject an invalid threshold - 400', async ({ inventoryProduct, adminToken }) => {
    // given
    const threshold = 0;

    // when
    const response = await client.get(inventoryProduct.id, adminToken, threshold);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'lowStockThreshold must be at least 1' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","adminToken"]))('should reject unauthenticated requests - 401', async ({ inventoryProduct, adminToken }) => {
    // given
    for (const { name, token, message } of unauthorizedCases(adminToken)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.get(inventoryProduct.id, token);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","account"]))('should forbid a regular client - 403', async ({ inventoryProduct, account }) => {
    // given
    const token = account.token;

    // when
    const response = await client.get(inventoryProduct.id, token);

    // then
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ message: 'Access denied' });
  });


  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should report a missing inventory item - 404', async ({ adminToken }) => {
    // given
    const productId = -1;

    // when
    const response = await client.get(productId, adminToken);

    // then
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: 'Product not found' });
  });
});
