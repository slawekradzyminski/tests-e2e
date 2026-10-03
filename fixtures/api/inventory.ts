import { requestFixture, pageFixture, type FixtureRegistry } from '../../support/fixtures';
import { randomUUID } from 'node:crypto';
import { expect } from 'e2e';
import { fixtures as baseFixtures, dependencies as baseDependencies } from './product';
import { CreateProductClient } from '../../clients/products/create-product-client';
import { ProductGenerator } from '../../generators/product-generator';
import type { ProductDto } from '../../types/product';

export const fixtures = { ...baseFixtures, ...{
  inventoryProduct: async ({ request, adminToken, trackProduct }, use) => {
    const response = await new CreateProductClient(request).create(ProductGenerator.generate({
      name: `Inventory Fixture ${randomUUID()}`,
      description: 'Deterministic inventory fixture',
      stockQuantity: 5,
      price: 12.34,
      category: 'Inventory Fixtures',
    }), adminToken);
    expect(response.status(), 'Create inventory fixture product').toBe(201);
    const product: ProductDto = await response.json();
    trackProduct(product.id);
    await use(product);
  },
} } satisfies FixtureRegistry;
export const dependencies = {  ...baseDependencies, inventoryProduct: ["request","adminToken","trackProduct"] };
