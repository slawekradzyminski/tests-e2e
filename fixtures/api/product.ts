import { requestFixture, pageFixture, type FixtureRegistry } from '../../support/fixtures';
import { expect } from 'e2e';
import { fixtures as baseFixtures, dependencies as baseDependencies } from '../shared/account';
import { CreateProductClient } from '../../clients/products/create-product-client';
import { DeleteProductClient } from '../../clients/products/delete-product-client';
import { ProductGenerator } from '../../generators/product-generator';
import type { ProductDto } from '../../types/product';

export const fixtures = { ...baseFixtures, ...{
  // Register successful creations before asserting their bodies, including in POST tests.
  trackProduct: async ({ request, adminToken }, use) => {
    const client = new DeleteProductClient(request);
    const ids = new Set<number>();
    try {
      await use((id: number) => ids.add(id));
    } finally {
      for (const id of ids) {
        const response = await client.delete(id, adminToken);
        expect.soft([204, 404], `Cleanup product ${id}`).toContain(response.status());
      }
    }
  },
  product: async ({ request, adminToken, trackProduct }, use) => {
    const response = await new CreateProductClient(request).create(ProductGenerator.generate(), adminToken);
    expect(response.status(), 'Create fixture product').toBe(201);
    const product: ProductDto = await response.json();
    trackProduct(product.id);
    await use(product);
  },
} } satisfies FixtureRegistry;
export const dependencies = {  ...baseDependencies, trackProduct: ["request","adminToken"], product: ["request","adminToken","trackProduct"] };
