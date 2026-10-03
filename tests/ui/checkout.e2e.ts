import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { shippingAddress, fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/commerce';

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["checkoutPage","orderDetailsPage","productDetailsPage","cartPage","seededCart","account"]))('places an order with the shipping address and empties the cart', { tags: ['ai', 'scale', 'four-operations'] }, async ({ checkoutPage, orderDetailsPage, productDetailsPage, cartPage, seededCart, account, agent }) => {
  // given
  await checkoutPage.open();
  await checkoutPage.expectSummary(seededCart, 2);
  await checkoutPage.expectReadyMeaning(agent);
  await checkoutPage.fillAddressWithAgent(shippingAddress, agent);
  await checkoutPage.expectAddressMeaning(agent);

  // when
  const orderId = await checkoutPage.placeWithAgent(agent);

  // then
  await orderDetailsPage.waitForConfirmationWithAgent(agent);
  await orderDetailsPage.expectUrl(orderId);
  await orderDetailsPage.expectOrder(orderId, seededCart, 2, shippingAddress);
  await orderDetailsPage.expectStatus('PENDING');
  await orderDetailsPage.expectConfirmationWithAgent(agent);
  await orderDetailsPage.header.expectCartCount(0);
  await orderDetailsPage.expectPersisted(orderId, account.token, { username: account.user.username, status: 'PENDING', totalAmount: 25, shippingAddress });
  await cartPage.expectPersistedItems(account.token, []);
  await productDetailsPage.expectPersistedStock(seededCart.id, account.token, 8);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["checkoutPage","cartPage","seededCart","account"]))('requires the shipping address without creating an order', { tags: ['ai', 'semantic', 'scale', 'challenge'] }, async ({ checkoutPage, cartPage, seededCart, account, agent }) => {
  // given
  await checkoutPage.open();
  await checkoutPage.expectSummary(seededCart, 2);
  await checkoutPage.expectReadyMeaning(agent);

  // when
  await checkoutPage.submitWithAgent(agent);

  // then
  await checkoutPage.expectRequiredAddress();
  await checkoutPage.expectUrl();
  await checkoutPage.expectNoOrders(account.token);
  await checkoutPage.expectMissingAddressWithAgent(agent);
  await cartPage.expectPersistedItems(account.token, [{ productId: seededCart.id, quantity: 2 }]);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["checkoutPage","cartPage"]))('returns an empty-cart checkout visit to the cart', { tags: ['ai', 'scale'] }, async ({ checkoutPage, cartPage, agent }) => {
  // given
  await cartPage.open();
  await cartPage.expectEmpty();
  await cartPage.expectEmptyWithAgent(agent);

  // when
  await checkoutPage.open();

  // then
  await cartPage.expectUrl();
  await cartPage.expectEmpty();
  await cartPage.expectEmptyWithAgent(agent);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["checkoutPage","cartPage","unavailableCart","account"]))('preserves the cart and address when stock becomes unavailable', { tags: ['ai', 'semantic', 'scale', 'challenge'] }, async ({ checkoutPage, cartPage, unavailableCart, account, agent }) => {
  // given
  await checkoutPage.open();
  await checkoutPage.fillAddressWithAgent(shippingAddress, agent);
  await checkoutPage.expectAddressMeaning(agent);

  // when
  await checkoutPage.submitWithAgent(agent);

  // then
  await checkoutPage.expectAvailabilityError('Some items are no longer available in the requested quantity. Your cart was preserved; review it before trying again.');
  await checkoutPage.expectAddress(shippingAddress);
  await checkoutPage.expectNoOrders(account.token);
  await cartPage.expectPersistedItems(account.token, [{ productId: unavailableCart.id, quantity: 2 }]);
  await checkoutPage.expectUnavailableStockWithAgent(agent);
});
