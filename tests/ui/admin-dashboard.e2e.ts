import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const adminTest = runner.extend<{ request: HttpClient }>({ request: requestFixture });
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixturesAdmin as adminTestFixtures, dependenciesAdmin as adminTestDependencies, fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/commerce';

adminTest.extend<Record<string, any>>(selectFixtures(adminTestFixtures, adminTestDependencies, ["adminDashboardPage","adminProductFormPage","shop"]))('identifies a low-stock product and opens the matching editor', { tags: ['ai', 'scale'] }, async ({ adminDashboardPage, adminProductFormPage, shop, agent }) => {
  // given
  const product = await shop.createProduct({ stockQuantity: 2 });
  await adminDashboardPage.open();
  await adminDashboardPage.expectLowStockProduct(product);
  await adminDashboardPage.expectLowStockMeaning(product, agent);

  // when
  await adminDashboardPage.editWithAgent(product, agent);

  // then
  await adminProductFormPage.expectValues(product);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminDashboardPage","homePage"]))('denies clients access to the admin dashboard', { tags: ['ai', 'scale'] }, async ({ adminDashboardPage, homePage, agent }) => {
  // given
  await homePage.open();

  // when
  await adminDashboardPage.open();

  // then
  await adminDashboardPage.expectClientDenied();
  await adminDashboardPage.expectMeaning(agent, 'The authenticated home page is displayed with a welcome card and Logout, rather than an admin dashboard with low-stock product administration.');
});
