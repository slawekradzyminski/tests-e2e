import { requestFixture, pageFixture, type FixtureRegistry } from '../../support/fixtures';
import { expect } from 'e2e';
import { randomUUID } from 'node:crypto';
import { fixtures as baseFixtures, dependencies as baseDependencies } from './authenticated';
import { APP_BASE_URL } from '../../test-config';
import { CreateProductClient } from '../../clients/products/create-product-client';
import { UpdateProductClient } from '../../clients/products/update-product-client';
import { DeleteProductClient } from '../../clients/products/delete-product-client';
import { GetProductsClient } from '../../clients/products/get-products-client';
import { DeleteUserClient } from '../../clients/users/delete-user-client';
import { AddCartItemClient } from '../../clients/cart/add-cart-item-client';
import { CreateOrderClient } from '../../clients/orders/create-order-client';
import type { ProductCreateDto, ProductDto } from '../../types/product';
import type { OrderDto } from '../../types/commerce';
import { shippingAddress } from '../api/commerce';

export { shippingAddress };

export const fixtures = { ...baseFixtures, ...{
  shop: async ({ request, account, adminToken }, use) => {
    const create = new CreateProductClient(request);
    const remove = new DeleteProductClient(request);
    const list = new GetProductsClient(request);
    const category = `UI ${randomUUID()}`;
    const ids = new Set<number>();
    try {
      await use({
        category,
        createProduct: async (overrides = {}) => {
          const response = await create.create({
            name: `Product ${randomUUID()}`, description: 'Isolated UI commerce product',
            price: 12.5, stockQuantity: 10, ...overrides, category,
          }, adminToken);
          expect(response.status(), 'Create disposable UI product').toBe(201);
          const product: ProductDto = await response.json();
          ids.add(product.id);
          return product;
        },
      });
    } finally {
      // Account deletion cascades carts/orders before their referenced products are removed.
      // The shared account tracker accepts 404 when the owner has already been removed here.
      expect.soft([204, 404]).toContain((await new DeleteUserClient(request).deleteUser(account.user.username, adminToken)).status());
      // Also recover successful UI creations if a test fails before reading the response.
      const response = await list.get(adminToken);
      expect.soft(response.status(), 'Find UI-created products for cleanup').toBe(200);
      if (response.ok()) {
        const products: ProductDto[] = await response.json();
        products.filter(product => product.category === category).forEach(product => ids.add(product.id));
      }
      for (const id of ids) {
        expect.soft([204, 404], `Delete disposable product ${id}`).toContain((await remove.delete(id, adminToken)).status());
      }
    }
  },
  unavailableCart: async ({ request, seededCart, adminToken }, use) => {
    expect((await new UpdateProductClient(request).update(seededCart.id, { stockQuantity: 0 }, adminToken)).status()).toBe(200);
    await use(seededCart);
  },
  deletedProduct: async ({ request, product, adminToken }, use) => {
    expect((await new DeleteProductClient(request).delete(product.id, adminToken)).status()).toBe(204);
    await use(product);
  },
  otherCartProduct: async ({ request, shop, account }, use) => {
    const product = await shop.createProduct({ price: 5 });
    expect((await new AddCartItemClient(request).add({ productId: product.id, quantity: 1 }, account.token)).status()).toBe(200);
    await use(product);
  },
  product: async ({ shop }, use) => { await use(await shop.createProduct()); },
  seededCart: async ({ request, product, account }, use) => {
    expect((await new AddCartItemClient(request).add({ productId: product.id, quantity: 2 }, account.token)).status()).toBe(200);
    await use(product);
  },
  order: async ({ request, seededCart: _seededCart, account }, use) => {
    const response = await new CreateOrderClient(request).create(shippingAddress, account.token);
    expect(response.status(), 'Create disposable order').toBe(201);
    await use(await response.json());
  },
} } satisfies FixtureRegistry;
export const dependencies = {  ...baseDependencies, shop: ["request","account","adminToken"], unavailableCart: ["request","seededCart","adminToken"], deletedProduct: ["request","product","adminToken"], otherCartProduct: ["request","shop","account"], product: ["shop"], seededCart: ["request","product","account"], order: ["request","seededCart","account"] };

export const fixturesAdmin = { ...fixtures, ...{
  storageState: async ({ adminSession }, use) => {
    await use({ cookies: [], origins: [{ origin: new URL(APP_BASE_URL).origin, localStorage: [
      { name: 'token', value: adminSession.token },
      { name: 'refreshToken', value: adminSession.refreshToken },
      { name: 'clientSessionId', value: randomUUID() },
    ] }] });
  },
} } satisfies FixtureRegistry;
export const dependenciesAdmin = {  ...dependencies, storageState: ["adminSession"] };
