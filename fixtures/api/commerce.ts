import { requestFixture, pageFixture, type FixtureRegistry } from '../../support/fixtures';
import { expect } from 'e2e';
import { fixtures as baseFixtures, dependencies as baseDependencies } from '../shared/admin';
import { SignupClient } from '../../clients/users/signup-client';
import { LoginClient } from '../../clients/users/login-client';
import { DeleteUserClient } from '../../clients/users/delete-user-client';
import { CreateProductClient } from '../../clients/products/create-product-client';
import { DeleteProductClient } from '../../clients/products/delete-product-client';
import { AddCartItemClient } from '../../clients/cart/add-cart-item-client';
import { CreateOrderClient } from '../../clients/orders/create-order-client';
import { signIn } from '../shared/session';
import { UserGenerator } from '../../generators/user-generator';
import { ProductGenerator } from '../../generators/product-generator';
import type { ProductDto } from '../../types/product';
import type { AddressDto, OrderDto } from '../../types/commerce';

export const shippingAddress: AddressDto = {
  street: '123 Main St', city: 'Warsaw', state: 'Mazovia', zipCode: '00-001', country: 'Poland',
};
interface CommerceUser { username: string; token: string }
interface Commerce { user: CommerceUser; other: CommerceUser; product: ProductDto }

export const fixtures = { ...baseFixtures, ...{
  commerce: async ({ request, adminToken }, use) => {
    const signup = new SignupClient(request);
    const login = new LoginClient(request);
    const deleteUser = new DeleteUserClient(request);
    const createProduct = new CreateProductClient(request);
    const deleteProduct = new DeleteProductClient(request);
    const users: CommerceUser[] = [];
    const usernames: string[] = [];
    let productId: number | undefined;
    try {
      for (let index = 0; index < 2; index++) {
        const account = UserGenerator.generate();
        const registered = await signup.signup(account);
        if (registered.status() === 201) usernames.push(account.username);
        expect(registered.status(), 'Register commerce user').toBe(201);
        const session = await signIn(login, account, 'ROLE_CLIENT');
        users.push({ username: account.username, token: session.token });
      }
      const created = await createProduct.create(ProductGenerator.generate({ price: 12.34, stockQuantity: 5 }), adminToken);
      const product: ProductDto = await created.json();
      if (created.status() === 201) productId = product.id;
      expect(created.status(), 'Create isolated commerce product').toBe(201);
      await use({ user: users[0], other: users[1], product });
    } finally {
      // Orders reference products: delete their owners (and dependent orders) first.
      for (const username of usernames) {
        expect.soft((await deleteUser.deleteUser(username, adminToken)).status(), 'Cleanup commerce account and orders').toBe(204);
      }
      if (productId !== undefined) {
        expect.soft((await deleteProduct.delete(productId, adminToken)).status(), 'Cleanup commerce product').toBe(204);
      }
    }
  },
  order: async ({ request, commerce }, use) => {
    const add = new AddCartItemClient(request);
    const create = new CreateOrderClient(request);
    expect((await add.add({ productId: commerce.product.id, quantity: 2 }, commerce.user.token)).status()).toBe(200);
    const response = await create.create(shippingAddress, commerce.user.token);
    expect(response.status(), 'Create fixture order').toBe(201);
    await use(await response.json());
  },
} } satisfies FixtureRegistry;
export const dependencies = {  ...baseDependencies, commerce: ["request","adminToken"], order: ["request","commerce"] };
