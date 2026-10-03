import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const adminTest = runner.extend<{ request: HttpClient }>({ request: requestFixture });
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixturesAdmin as adminTestFixtures, dependenciesAdmin as adminTestDependencies, fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/commerce';

adminTest.extend<Record<string, any>>(selectFixtures(adminTestFixtures, adminTestDependencies, ["adminOrdersPage","orderDetailsPage","order","adminToken"]))('filters orders, opens the selected order and saves its new status', { tags: ['ai', 'semantic', 'act-expansion', 'scale', 'challenge'] }, async ({ adminOrdersPage, orderDetailsPage, order, adminToken, agent }) => {
  // given
  await adminOrdersPage.open();
  await adminOrdersPage.filter('PENDING');
  await adminOrdersPage.expectOrder(order);

  // when
  await adminOrdersPage.viewOrder(order.id);
  await orderDetailsPage.markPaidWithAgent(agent);

  // then
  await orderDetailsPage.expectStatus('PAID');
  await orderDetailsPage.expectPaidWithAgent(agent);
  await orderDetailsPage.expectPersisted(order.id, adminToken, { status: 'PAID' });
  await adminOrdersPage.open();
  await adminOrdersPage.filter('PAID');
  await adminOrdersPage.expectOrder({ ...order, status: 'PAID' });

  // when
  await adminOrdersPage.filter('PENDING');

  // then
  await adminOrdersPage.expectOrderAbsent(order.id);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminOrdersPage","homePage"]))('denies clients access to all-customer order administration', { tags: ['ai', 'scale'] }, async ({ adminOrdersPage, homePage, agent }) => {
  // given
  await homePage.open();

  // when
  await adminOrdersPage.open();

  // then
  await adminOrdersPage.expectClientDenied();
  await adminOrdersPage.expectMeaning(agent, 'The authenticated home page is displayed with a welcome card and Logout, rather than an all-customer orders table with order-status filtering.');
});
