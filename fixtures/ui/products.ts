import { requestFixture, pageFixture, type FixtureRegistry } from '../../support/fixtures';
import { AddCartItemClient } from '../../clients/cart/add-cart-item-client';
import { expect } from 'e2e';
import { randomUUID } from 'node:crypto';
import { fixtures as baseFixtures, dependencies as baseDependencies } from './authenticated';
import { CreateProductClient } from '../../clients/products/create-product-client';
import { DeleteProductClient } from '../../clients/products/delete-product-client';
import { ClearCartClient } from '../../clients/cart/clear-cart-client';
import type { ProductDto } from '../../types/product';

export const fixtures = { ...baseFixtures, ...{
  cartWithOtherProduct: async ({ request, account, catalog }, use) => {
    const product = catalog.products[2];
    const response = await new AddCartItemClient(request).add({ productId: product.id, quantity: 1 }, account.token);
    expect(response.status(), 'Seed another cart product').toBe(200);
    await use(product);
  },
  catalog: async ({ request, adminToken, account }, use) => {
    const create = new CreateProductClient(request);
    const remove = new DeleteProductClient(request);
    const cart = new ClearCartClient(request);
    const category = `Catalog ${randomUUID()}`;
    const products: ProductDto[] = [];
    try {
      for (const [name, price] of [['Alpha', 30], ['Beta', 10], ['Gamma', 20]] as const) {
        const response = await create.create({
          name: `${category} ${name}`, category, price,
          description: `Test catalog item ${name}`, stockQuantity: 10,
        }, adminToken);
        expect(response.status(), 'Create isolated catalog item').toBe(201);
        products.push(await response.json());
      }
      await use({ category, products });
    } finally {
      expect.soft((await cart.clear(account.token)).status(), 'Clear cart before removing products').toBe(204);
      for (const product of products) {
        expect.soft((await remove.delete(product.id, adminToken)).status(), 'Remove catalog item').toBe(204);
      }
    }
  },
} } satisfies FixtureRegistry;
export const dependencies = {  ...baseDependencies, cartWithOtherProduct: ["request","account","catalog"], catalog: ["request","adminToken","account"] };
