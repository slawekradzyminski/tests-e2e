import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/inventory';
import { ListInventoryClient } from '../../../clients/inventory/list-inventory-client';
import { unauthorizedCases } from '../test-data/unauthorized-cases';

test.describe('GET /api/v1/admin/inventory', () => {
  let client: ListInventoryClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new ListInventoryClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","adminToken"]))('should list the fixture product as an administrator - 200', async ({ inventoryProduct, adminToken }) => {
    // given
    const product = inventoryProduct;

    // when
    const response = await client.list(adminToken, { search: product.name });

    // then
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ pageNumber: 0, pageSize: 20 });
    expect(body.content).toEqual(expect.arrayContaining([
      expect.objectContaining({
        productId: product.id,
        name: product.name,
        category: product.category,
        availableQuantity: 5,
        stockStatus: 'LOW_STOCK',
      }),
    ]));
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","adminToken"]))('should honor page size for inventory results - 200', async ({ inventoryProduct, adminToken }) => {
    // given
    const query = { search: inventoryProduct.name, page: 0, size: 1 };

    // when
    const response = await client.list(adminToken, query);

    // then
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.pageNumber).toBe(0);
    expect(body.pageSize).toBe(1);
    expect(body.content).toHaveLength(1);
    expect(body.content[0].productId).toBe(inventoryProduct.id);
    expect(body.totalElements).toBe(1);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["inventoryProduct","adminToken"]))('should combine catalog and stock filters within the fixture results - 200', async ({ inventoryProduct, adminToken }) => {
    // given
    const query = { search: inventoryProduct.name.toLowerCase(), category: inventoryProduct.category.toLowerCase(), lowStockThreshold: 5 };

    // when
    const matching = await client.list(adminToken, { ...query, status: 'LOW_STOCK' });
    const excluded = await client.list(adminToken, { ...query, status: 'OUT_OF_STOCK' });

    // then
    expect(matching.status()).toBe(200);
    const body = await matching.json();
    expect(body.content).toHaveLength(1);
    expect(body.content[0]).toMatchObject({ productId: inventoryProduct.id, stockStatus: 'LOW_STOCK' });
    expect(excluded.status()).toBe(200);
    expect(await excluded.json()).toMatchObject({ content: [], totalElements: 0 });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should reject an invalid low stock threshold - 400', async ({ adminToken }) => {
    // given
    const query = { lowStockThreshold: 0 };

    // when
    const response = await client.list(adminToken, query);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'lowStockThreshold must be at least 1' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should reject unauthenticated requests - 401', async ({ adminToken }) => {
    // given
    for (const { name, token, message } of unauthorizedCases(adminToken)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.list(token);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should forbid a regular client - 403', async ({ account }) => {
    // given
    const token = account.token;

    // when
    const response = await client.list(token);

    // then
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ message: 'Access denied' });
  });
});
