import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/product';
import { DeleteProductClient } from '../../../clients/products/delete-product-client';
import { GetProductByIdClient } from '../../../clients/products/get-product-by-id-client';
import { GetProductsClient } from '../../../clients/products/get-products-client';
import { unauthorizedCases } from '../test-data/unauthorized-cases';

test.describe('DELETE /api/v1/products/{id}', () => {
  let client: DeleteProductClient;
  let deleteClient: DeleteProductClient;
  let getClient: GetProductByIdClient;
  let listClient: GetProductsClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new DeleteProductClient(request);
    deleteClient = new DeleteProductClient(request);
    getClient = new GetProductByIdClient(request);
    listClient = new GetProductsClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["product","adminToken"]))('should delete a product as admin - 204', async ({ product, adminToken }) => {
    // given
    const id = product.id;

    // when
    const response = await client.delete(id, adminToken);

    // then
    expect(response.status()).toBe(204);
    expect(await response.text()).toBe('');
    const stored = await getClient.get(id, adminToken);
    expect(stored.status()).toBe(404);
    expect(await stored.json()).toEqual({ message: 'Product not found' });
    const catalog = await listClient.get(adminToken);
    expect(catalog.status()).toBe(200);
    expect((await catalog.json()).some((item: { id: number }) => item.id === id)).toBe(false);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should reject a nonnumeric identifier - 400', async ({ adminToken }) => {
    // given
    const token = adminToken;

    // when
    const response = await client.delete('abc', token);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'For input string: "abc"' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["product","adminToken"]))('should reject unauthorized requests - 401', async ({ product, adminToken }) => {
    // given

    for (const { name, token, message } of unauthorizedCases(adminToken)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.delete(product.id, token);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
    const stored = await getClient.get(product.id, adminToken);
    expect(stored.status()).toBe(200);
    expect(await stored.json()).toEqual(product);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["product","account","adminToken"]))('should forbid a regular client without changing the catalog - 403', async ({ product, account, adminToken }) => {
    // given
    const token = account.token;

    // when
    const response = await client.delete(product.id, token);

    // then
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ message: 'Access denied' });
    const stored = await getClient.get(product.id, adminToken);
    expect(stored.status()).toBe(200);
    expect(await stored.json()).toEqual(product);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["product","adminToken"]))('should return not found for a deleted product - 404', async ({ product, adminToken }) => {
    // given
    const token = adminToken;
    expect((await deleteClient.delete(product.id, adminToken)).status()).toBe(204);

    // when
    const response = await client.delete(product.id, token);

    // then
    expect(response.status()).toBe(404);
    expect(await response.text()).toBe('');
  });
});
