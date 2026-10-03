import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/commerce';

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["productDetailsPage","cartPage","product","account"]))('adds, updates and removes a product from its detail screen', { tags: ['ai', 'scale'] }, async ({ productDetailsPage, cartPage, product, account, agent }) => {
  // given
  await productDetailsPage.open(product.id);
  await productDetailsPage.expectProduct(product);
  await productDetailsPage.expectProductMeaning(agent, product);

  // when
  await productDetailsPage.saveQuantityWithAgent(agent, 2);

  // then
  await productDetailsPage.toast.expectMessage('Added to cart', `2 × ${product.name} added to your cart`);
  await productDetailsPage.expectInCart(2);
  await productDetailsPage.expectCartMeaning(agent, 2);
  await productDetailsPage.header.expectCartCount(2);
  await cartPage.expectPersistedItems(account.token, [{ productId: product.id, quantity: 2 }]);
  await productDetailsPage.reload();
  await productDetailsPage.expectInCart(2);
  await productDetailsPage.expectCartMeaning(agent, 2);

  // when
  await productDetailsPage.saveQuantityWithAgent(agent, 3);

  // then
  await productDetailsPage.toast.expectMessage('Cart updated', `${product.name} quantity set to 3`);
  await productDetailsPage.expectInCart(3);
  await productDetailsPage.expectCartMeaning(agent, 3);
  await productDetailsPage.header.expectCartCount(3);
  await cartPage.expectPersistedItems(account.token, [{ productId: product.id, quantity: 3 }]);

  // when
  await productDetailsPage.removeWithAgent(agent);

  // then
  await productDetailsPage.toast.expectMessage('Removed from cart', `${product.name} has been removed from your cart`);
  await productDetailsPage.expectNotInCart();
  await productDetailsPage.expectRemovedMeaning(agent);
  await productDetailsPage.header.expectCartCount(0);
  await cartPage.expectPersistedItems(account.token, []);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["productDetailsPage","cartPage","shop","account"]))('prevents adding an out-of-stock product', { tags: ['ai', 'semantic', 'scale', 'challenge'] }, async ({ productDetailsPage, cartPage, shop, account, agent }) => {
  // given
  const product = await shop.createProduct({ stockQuantity: 0 });

  // when
  await productDetailsPage.open(product.id);

  // then
  await productDetailsPage.expectProduct(product);
  await productDetailsPage.expectProductMeaning(agent, product);
  await productDetailsPage.expectOutOfStock();
  await productDetailsPage.expectStockConstraintWithAgent(agent);
  await cartPage.expectPersistedItems(account.token, []);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["productDetailsPage","productsPage","deletedProduct"]))('offers catalog recovery when a product is no longer available', { tags: ['ai', 'scale'] }, async ({ productDetailsPage, productsPage, deletedProduct, agent }) => {
  // given
  await productDetailsPage.open(deletedProduct.id);
  await productDetailsPage.expectUnavailable();
  await productDetailsPage.expectUnavailableMeaning(agent);

  // when
  await productDetailsPage.recoverWithAgent(agent);

  // then
  await productsPage.expectUrl();
  await productsPage.expectVisible();
});
