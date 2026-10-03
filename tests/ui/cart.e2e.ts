import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/commerce';

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["cartPage","seededCart","otherCartProduct","account"]))('updates a line, recomputes multi-product totals and removes items to empty', { tags: ['ai', 'semantic', 'scale', 'challenge'] }, async ({ cartPage, seededCart, otherCartProduct, account, agent }) => {
  // given
  const other = otherCartProduct;
  await cartPage.open();
  await cartPage.expectSummary(3, 30);
  await cartPage.expectSummaryMeaning(agent, 3, 30);

  // when
  await cartPage.updateWithAgent(seededCart, agent);

  // then
  await cartPage.expectItem(seededCart, 3);
  await cartPage.expectSummary(4, 42.5);
  await cartPage.expectCombinedCartWithAgent(agent);
  await cartPage.header.expectCartCount(4);
  await cartPage.expectPersistedItems(account.token, [{ productId: seededCart.id, quantity: 3 }, { productId: other.id, quantity: 1 }]);
  await cartPage.reload();
  await cartPage.expectSummary(4, 42.5);

  // when
  await cartPage.removeWithAgent(seededCart, agent);

  // then
  await cartPage.expectItem(other, 1);
  await cartPage.expectSummary(1, 5);
  await cartPage.expectRemovalMeaning(agent);
  await cartPage.header.expectCartCount(1);
  await cartPage.expectPersistedItems(account.token, [{ productId: other.id, quantity: 1 }]);

  // when
  await cartPage.removeWithAgent(other, agent);

  // then
  await cartPage.expectEmpty();
  await cartPage.expectEmptyWithAgent(agent);
  await cartPage.header.expectCartCount(0);
  await cartPage.expectPersistedItems(account.token, []);
  await cartPage.expectEmptyWithAgent(agent);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["cartPage","seededCart","account"]))('clears the cart only after confirmation', { tags: ['ai', 'scale'] }, async ({ cartPage, seededCart, account, agent }) => {
  // given
  await cartPage.open();
  await cartPage.expectItem(seededCart, 2);

  // when
  await cartPage.clear(false);

  // then
  await cartPage.expectSummary(2, 25);
  await cartPage.expectSummaryMeaning(agent, 2, 25);
  await cartPage.expectPersistedItems(account.token, [{ productId: seededCart.id, quantity: 2 }]);

  // when
  await cartPage.clearWithAgent(agent);

  // then
  await cartPage.expectEmpty();
  await cartPage.expectEmptyWithAgent(agent);
  await cartPage.header.expectCartCount(0);
  await cartPage.expectPersistedItems(account.token, []);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["cartPage","checkoutPage","seededCart"]))('continues to checkout with the saved cart', { tags: ['ai', 'scale'] }, async ({ cartPage, checkoutPage, seededCart, agent }) => {
  // given
  await cartPage.open();
  await cartPage.expectItem(seededCart, 2);

  // when
  await cartPage.checkoutWithAgent(agent);

  // then
  await checkoutPage.expectUrl();
  await checkoutPage.expectSummary(seededCart, 2);
});
