import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/product';
import { GetProductsClient } from '../../../clients/products/get-products-client';
import { unauthorizedCases } from '../test-data/unauthorized-cases';

test.describe('GET /api/v1/products', () => {
  let client: GetProductsClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new GetProductsClient(request);
  });

  for (const role of ['admin', 'client'] as const) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["product","adminToken","account"]))(`should read the product as ${role} - 200`, async ({ product, adminToken, account }) => {
      // given
      const token = role === 'admin' ? adminToken : account.token;

      // when
      const response = await client.get(token);

      // then
      expect(response.status()).toBe(200);
      const products = await response.json();
      expect(Array.isArray(products)).toBe(true);
      expect(products.filter((item: { id: number }) => item.id === product.id)).toEqual([product]);
    });
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminToken"]))('should reject unauthorized requests - 401', async ({ adminToken }) => {
    // given

    for (const { name, token, message } of unauthorizedCases(adminToken)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.get(token);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });
});
