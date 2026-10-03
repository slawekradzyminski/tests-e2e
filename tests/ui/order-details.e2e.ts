import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { shippingAddress, fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/commerce';

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["orderDetailsPage","productDetailsPage","order","product","account"]))('shows the own order and cancels it only after confirmation', { tags: ['ai', 'semantic', 'act-expansion', 'scale', 'challenge'] }, async ({ orderDetailsPage, productDetailsPage, order, product, account, agent }) => {
  // given
  await orderDetailsPage.open(order.id);
  await orderDetailsPage.expectOrder(order.id, product, 2, shippingAddress);
  await orderDetailsPage.expectStatus('PENDING');
  await orderDetailsPage.expectClientControls();

  // when
  await orderDetailsPage.cancel(false);

  // then
  await orderDetailsPage.expectStatus('PENDING');
  await orderDetailsPage.expectPersisted(order.id, account.token, { status: 'PENDING' });
  await productDetailsPage.expectPersistedStock(product.id, account.token, 8);

  // when
  await orderDetailsPage.cancelWithAgent(agent);

  // then
  await orderDetailsPage.expectStatus('CANCELLED');
  await orderDetailsPage.expectCancellationUnavailable();
  await orderDetailsPage.expectCancelledWithAgent(agent);
  await orderDetailsPage.expectPersisted(order.id, account.token, { status: 'CANCELLED' });
  await productDetailsPage.expectPersistedStock(product.id, account.token, 10);
  await orderDetailsPage.reload();
  await orderDetailsPage.expectStatus('CANCELLED');
});
