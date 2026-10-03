import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/commerce';
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import { RemoveCartItemClient } from '../../../clients/cart/remove-cart-item-client';
import { AddCartItemClient } from '../../../clients/cart/add-cart-item-client';
import { GetCartClient } from '../../../clients/cart/get-cart-client';
import { GetProductByIdClient } from '../../../clients/products/get-product-by-id-client';

test.describe('DELETE /api/v1/cart/items/{productId}', () => {
  let remove: RemoveCartItemClient;
  let add: AddCartItemClient;
  let cart: GetCartClient;
  let product: GetProductByIdClient;

  test.beforeEach(async ({ request }) => {
    // given
    remove = new RemoveCartItemClient(request);
    add = new AddCartItemClient(request);
    cart = new GetCartClient(request);
    product = new GetProductByIdClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should remove an item without consuming stock - 200', async ({ commerce }) => {
    // given
    expect((await add.add({ productId: commerce.product.id, quantity: 2 }, commerce.user.token)).status()).toBe(200);

    // when
    const response = await remove.remove(commerce.product.id, commerce.user.token);

    // then
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ username: commerce.user.username, items: [], totalPrice: 0, totalItems: 0 });
    const storedProduct = await product.get(commerce.product.id, commerce.user.token);
    expect(storedProduct.status()).toBe(200);
    expect((await storedProduct.json()).stockQuantity).toBe(5);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should reject a nonnumeric product identifier - 400', async ({ commerce }) => {
    // given
    const id = 'abc';

    // when
    const response = await remove.remove(id, commerce.user.token);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'For input string: "abc"' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should reject missing, invalid and tampered credentials - 401', async ({ commerce }) => {
    // given
    const token = commerce.user.token;
    for (const { name, token: rejectedToken, message } of unauthorizedCases(token)) {
      await scenarioStep(name, async () => {
        // when
        const response = await remove.remove(commerce.product.id, rejectedToken);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should not remove another users cart item - 404', async ({ commerce }) => {
    // given
    expect((await add.add({ productId: commerce.product.id, quantity: 2 }, commerce.user.token)).status()).toBe(200);

    // when
    const response = await remove.remove(commerce.product.id, commerce.other.token);

    // then
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: 'Cart item not found' });
    const stored = await cart.get(commerce.user.token);
    expect(stored.status()).toBe(200);
    expect(await stored.json()).toEqual({ username: commerce.user.username, items: [{ productId: commerce.product.id, quantity: 2 }], totalPrice: 24.68, totalItems: 2 });
  });
});
