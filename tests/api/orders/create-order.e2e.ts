import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { shippingAddress, fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/api/commerce';
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import { CreateOrderClient } from '../../../clients/orders/create-order-client';
import { AddCartItemClient } from '../../../clients/cart/add-cart-item-client';
import { GetCartClient } from '../../../clients/cart/get-cart-client';
import { GetProductByIdClient } from '../../../clients/products/get-product-by-id-client';
import { GetOrdersClient } from '../../../clients/orders/get-orders-client';
import { GetOrderClient } from '../../../clients/orders/get-order-client';
import { UpdateProductClient } from '../../../clients/products/update-product-client';

test.describe('POST /api/v1/orders', () => {
  let create: CreateOrderClient;
  let add: AddCartItemClient;
  let cart: GetCartClient;
  let product: GetProductByIdClient;
  let orders: GetOrdersClient;
  let detail: GetOrderClient;
  let changeProduct: UpdateProductClient;

  test.beforeEach(async ({ request }) => {
    // given
    create = new CreateOrderClient(request);
    add = new AddCartItemClient(request);
    cart = new GetCartClient(request);
    product = new GetProductByIdClient(request);
    orders = new GetOrdersClient(request);
    detail = new GetOrderClient(request);
    changeProduct = new UpdateProductClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should create an order from cart and consume stock exactly once - 201', async ({ commerce }) => {
    // given
    expect((await add.add({ productId: commerce.product.id, quantity: 2 }, commerce.user.token)).status()).toBe(200);

    // when
    const response = await create.create(shippingAddress, commerce.user.token);

    // then
    expect(response.status()).toBe(201);
    const order = await response.json();
    expect(order).toEqual({
      id: expect.any(Number), username: commerce.user.username, status: 'PENDING',
      shippingAddress, totalAmount: 24.68, createdAt: expect.any(String), updatedAt: expect.any(String),
      items: [{ id: expect.any(Number), productId: commerce.product.id, productName: commerce.product.name, quantity: 2, unitPrice: 12.34, totalPrice: 24.68 }],
    });
    expect(order.id).toBeGreaterThan(0);
    expect(await (await detail.get(order.id, commerce.user.token)).json()).toEqual(order);
    expect(await (await cart.get(commerce.user.token)).json()).toEqual({ username: commerce.user.username, items: [], totalPrice: 0, totalItems: 0 });
    expect((await create.create(shippingAddress, commerce.user.token)).status()).toBe(400);
    const storedProduct = await product.get(commerce.product.id, commerce.user.token);
    expect(storedProduct.status()).toBe(200);
    expect((await storedProduct.json()).stockQuantity).toBe(3);
    expect((await (await orders.get(commerce.user.token)).json()).totalElements).toBe(1);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should reject checkout of an empty cart - 400', async ({ commerce }) => {
    // given
    const token = commerce.user.token;

    // when
    const response = await create.create(shippingAddress, token);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ message: 'Cart is empty' });
    const storedProduct = await product.get(commerce.product.id, commerce.user.token);
    expect(storedProduct.status()).toBe(200);
    expect((await storedProduct.json()).stockQuantity).toBe(5);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should reject an invalid address without consuming the cart - 400', async ({ commerce }) => {
    // given
    expect((await add.add({ productId: commerce.product.id, quantity: 2 }, commerce.user.token)).status()).toBe(200);

    // when
    const response = await create.create({ ...shippingAddress, zipCode: "bad" }, commerce.user.token);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ zipCode: 'Invalid postal/zip code format' });
    const stored = await cart.get(commerce.user.token);
    expect(stored.status()).toBe(200);
    expect(await stored.json()).toEqual({ username: commerce.user.username, items: [{ productId: commerce.product.id, quantity: 2 }], totalPrice: 24.68, totalItems: 2 });
    const storedProduct = await product.get(commerce.product.id, commerce.user.token);
    expect(storedProduct.status()).toBe(200);
    expect((await storedProduct.json()).stockQuantity).toBe(5);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce"]))('should reject missing, invalid and tampered credentials - 401', async ({ commerce }) => {
    // given
    const token = commerce.user.token;
    for (const { name, token: rejectedToken, message } of unauthorizedCases(token)) {
      await scenarioStep(name, async () => {
        // when
        const response = await create.create(shippingAddress, rejectedToken);

        // then
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message });
      });
    }
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["commerce","adminToken"]))('should recheck stock at checkout and preserve cart on failure - 409', async ({ commerce, adminToken }) => {
    // given
    expect((await add.add({ productId: commerce.product.id, quantity: 2 }, commerce.user.token)).status()).toBe(200);
    expect((await changeProduct.update(commerce.product.id, { stockQuantity: 1 }, adminToken)).status()).toBe(200);

    // when
    const response = await create.create(shippingAddress, commerce.user.token);

    // then
    expect(response.status()).toBe(409);
    expect(await response.json()).toEqual({ message: `Insufficient stock for product ${commerce.product.id}` });
    const stored = await cart.get(commerce.user.token);
    expect(stored.status()).toBe(200);
    expect(await stored.json()).toEqual({ username: commerce.user.username, items: [{ productId: commerce.product.id, quantity: 2 }], totalPrice: 24.68, totalItems: 2 });
    const storedProduct = await product.get(commerce.product.id, commerce.user.token);
    expect(storedProduct.status()).toBe(200);
    expect((await storedProduct.json()).stockQuantity).toBe(1);
    expect((await (await orders.get(commerce.user.token)).json()).totalElements).toBe(0);
  });
});
