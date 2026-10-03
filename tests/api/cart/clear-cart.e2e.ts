import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/commerce';
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import { ClearCartClient } from '../../../clients/cart/clear-cart-client';
import { AddCartItemClient } from '../../../clients/cart/add-cart-item-client';
import { GetCartClient } from '../../../clients/cart/get-cart-client';
import { GetProductByIdClient } from '../../../clients/products/get-product-by-id-client';

test.describe('DELETE /api/v1/cart', () => {
  let clear: ClearCartClient;
  let add: AddCartItemClient;
  let cart: GetCartClient;
  let product: GetProductByIdClient;

  test.beforeEach(async ({ request }) => {
    // given
    clear = new ClearCartClient(request);
    add = new AddCartItemClient(request);
    cart = new GetCartClient(request);
    product = new GetProductByIdClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should clear only the caller cart without changing stock - 204', async ({ commerce }) => {
    // given
    expect((await add.add({ productId: commerce.product.id, quantity: 2 }, commerce.user.token)).status()).toBe(200);
    expect((await add.add({ productId: commerce.product.id, quantity: 2 }, commerce.other.token)).status()).toBe(200);

    // when
    const response = await clear.clear(commerce.user.token);

    // then
    expect(response.status()).toBe(204);
    expect(await response.text()).toBe('');
    expect(await (await cart.get(commerce.user.token)).json()).toEqual({ username: commerce.user.username, items: [], totalPrice: 0, totalItems: 0 });
    expect((await (await cart.get(commerce.other.token)).json()).totalItems).toBe(2);
    const storedProduct = await product.get(commerce.product.id, commerce.user.token);
    expect(storedProduct.status()).toBe(200);
    expect((await storedProduct.json()).stockQuantity).toBe(5);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should allow clearing an empty cart repeatedly - 204', async ({ commerce }) => {
    // given
    expect((await clear.clear(commerce.user.token)).status()).toBe(204);

    // when
    const response = await clear.clear(commerce.user.token);

    // then
    expect(response.status()).toBe(204);
    expect(await response.text()).toBe('');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should reject missing, invalid and tampered credentials - 401', async ({ commerce }) => {
    // given
    const token = commerce.user.token;
    for (const { name, token: rejectedToken, message } of unauthorizedCases(token)) {
      await scenarioStep(name, async () => {
        // when
        const response = await clear.clear(rejectedToken);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });
});
