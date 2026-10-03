import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { DeleteProductClient } from '../../../clients/products/delete-product-client';
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/product';
import { UpdateProductClient } from '../../../clients/products/update-product-client';
import { GetProductByIdClient } from '../../../clients/products/get-product-by-id-client';
import { ProductGenerator } from '../../../generators/product-generator';
import { unauthorizedCases } from '../test-data/unauthorized-cases';

test.describe('PUT /api/v1/products/{id}', () => {
  let client: UpdateProductClient;
  let deleteClient: DeleteProductClient;
  let getClient: GetProductByIdClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new UpdateProductClient(request);
    deleteClient = new DeleteProductClient(request);
    getClient = new GetProductByIdClient(request);
  });

  const updates = [
    { name: 'all mutable fields', payload: ProductGenerator.generate({ price: 99.99, stockQuantity: 9, category: 'Updated' }) },
    { name: 'partial update at minimum boundaries', payload: { price: 0.01, stockQuantity: 0 } },
    { name: 'maximum text boundaries', payload: { name: 'x'.repeat(100), description: 'x'.repeat(1000), imageUrl: '' } },
  ];
  for (const { name, payload } of updates) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["product","adminToken"]))(`should persist ${name} as admin - 200`, async ({ product, adminToken }) => {
      // given
      const expected = { ...product, ...payload, updatedAt: expect.any(String) };

      // when
      const response = await client.update(product.id, payload, adminToken);

      // then
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual(expected);
      const stored = await getClient.get(product.id, adminToken);
      expect(stored.status()).toBe(200);
      expect(await stored.json()).toEqual(await response.json());
    });
  }

  const invalidCases = [
    { name: 'short name', patch: { name: 'ab' }, error: { name: 'Product name must be between 3 and 100 characters' } },
    { name: 'long name', patch: { name: 'x'.repeat(101) }, error: { name: 'Product name must be between 3 and 100 characters' } },
    { name: 'long description', patch: { description: 'x'.repeat(1001) }, error: { description: 'Description cannot exceed 1000 characters' } },
    { name: 'zero price', patch: { price: 0 }, error: { price: 'Price must be greater than 0' } },
    { name: 'negative stock', patch: { stockQuantity: -1 }, error: { stockQuantity: 'Stock quantity cannot be negative' } },
    { name: 'invalid image URL', patch: { imageUrl: 'ftp://example.com' }, error: { imageUrl: 'Image URL must be a valid URL or empty' } },
  ];
  for (const { name, patch, error } of invalidCases) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["product","adminToken"]))(`should reject ${name} - 400`, async ({ product, adminToken }) => {
      // given
      const payload = ProductGenerator.generate(patch);
      const token = adminToken;

      // when
      const response = await client.update(product.id, payload, token);

      // then
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual(error);
      const stored = await getClient.get(product.id, adminToken);
      expect(stored.status()).toBe(200);
      expect(await stored.json()).toEqual(product);
    });
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should reject a nonnumeric identifier - 400', async ({ adminToken }) => {
    // given
    const token = adminToken;
    const payload = { price: 5 };

    // when
    const response = await client.update('abc', payload, token);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'For input string: "abc"' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["product","adminToken"]))('should reject unauthorized requests - 401', async ({ product, adminToken }) => {
    // given
    const payload = ProductGenerator.generate();

    for (const { name, token, message } of unauthorizedCases(adminToken)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.update(product.id, payload, token);

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
    const payload = ProductGenerator.generate();

    // when
    const response = await client.update(product.id, payload, token);

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
    const payload = { price: 5 };
    expect((await deleteClient.delete(product.id, adminToken)).status()).toBe(204);

    // when
    const response = await client.update(product.id, payload, token);

    // then
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: 'Product not found' });
  });
});
