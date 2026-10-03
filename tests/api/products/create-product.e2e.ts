import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/product';
import { CreateProductClient } from '../../../clients/products/create-product-client';
import { GetProductByIdClient } from '../../../clients/products/get-product-by-id-client';
import { ProductGenerator } from '../../../generators/product-generator';
import { unauthorizedCases } from '../test-data/unauthorized-cases';

test.describe('POST /api/v1/products', () => {
  let client: CreateProductClient;
  let getClient: GetProductByIdClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new CreateProductClient(request);
    getClient = new GetProductByIdClient(request);
  });

  const validCases = [
    { name: 'complete Unicode product', overrides: { description: 'Ceramic coffee cup — żółć 🌍' } },
    { name: 'minimum boundaries', overrides: { name: 'abc', description: 'Valid description', price: 0.01, stockQuantity: 0, imageUrl: '' } },
    { name: 'maximum text boundaries', overrides: { name: 'x'.repeat(100), description: 'x'.repeat(1000) } },
  ];
  for (const { name, overrides } of validCases) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken","trackProduct"]))(`should create ${name} as admin - 201`, async ({ adminToken, trackProduct }) => {
      // given
      const payload = ProductGenerator.generate(overrides);

      // when
      const response = await client.create(payload, adminToken);
      if (response.status() === 201) trackProduct((await response.json()).id);

      // then
      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body).toEqual({ ...payload, id: expect.any(Number), createdAt: expect.any(String), updatedAt: expect.any(String) });
      expect(Number.isSafeInteger(body.id)).toBe(true);
      expect(body.id).toBeGreaterThan(0);
      const stored = await getClient.get(body.id, adminToken);
      expect(stored.status()).toBe(200);
      expect(await stored.json()).toEqual(body);
    });
  }

  const invalidCases = [
    { name: 'short name', patch: { name: 'ab' }, error: { name: 'Product name must be between 3 and 100 characters' } },
    { name: 'long name', patch: { name: 'x'.repeat(101) }, error: { name: 'Product name must be between 3 and 100 characters' } },
    { name: 'long description', patch: { description: 'x'.repeat(1001) }, error: { description: 'Description cannot exceed 1000 characters' } },
    { name: 'zero price', patch: { price: 0 }, error: { price: 'Price must be greater than 0' } },
    { name: 'negative stock', patch: { stockQuantity: -1 }, error: { stockQuantity: 'Stock quantity cannot be negative' } },
    { name: 'invalid image URL', patch: { imageUrl: 'ftp://example.com' }, error: { imageUrl: 'Image URL must be a valid URL or empty' } },
    { name: 'empty category', patch: { category: '' }, error: { category: 'Category is required' } },
  ];
  for (const { name, patch, error } of invalidCases) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken","trackProduct"]))(`should reject ${name} - 400`, async ({ adminToken, trackProduct }) => {
      // given
      const payload = ProductGenerator.generate(patch);
      const token = adminToken;

      // when
      const response = await client.create(payload, token);
      if (response.status() === 201) trackProduct((await response.json()).id);

      // then
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual(error);
    });
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken","trackProduct"]))('should reject unauthorized requests - 401', async ({ adminToken, trackProduct }) => {
    // given
    const payload = ProductGenerator.generate();

    for (const { name, token, message } of unauthorizedCases(adminToken)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.create(payload, token);
        if (response.status() === 201) trackProduct((await response.json()).id);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should forbid product creation as a regular client - 403', async ({ account }) => {
    // given
    const payload = ProductGenerator.generate();

    // when
    const response = await client.create(payload, account.token);

    // then
    expect(response.status()).toBe(403);
  });
});
