import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const adminTest = runner.extend<{ request: HttpClient }>({ request: requestFixture });
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixturesAdmin as adminTestFixtures, dependenciesAdmin as adminTestDependencies, fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/commerce';

adminTest.extend<Record<string, any>>(selectFixtures(adminTestFixtures, adminTestDependencies, ["adminProductsPage","product","adminToken"]))('lists a disposable product and deletes it only after confirmation', { tags: ['ai', 'scale'] }, async ({ adminProductsPage, product, adminToken, agent }) => {
  // given
  await adminProductsPage.open();
  await adminProductsPage.expectProduct(product);
  await adminProductsPage.expectProductMeaning(product, agent);

  // when
  await adminProductsPage.remove(product.id, false);

  // then
  await adminProductsPage.expectProduct(product);
  await adminProductsPage.expectProductMeaning(product, agent);

  // when
  await adminProductsPage.removeWithAgent(product, agent);

  // then
  await adminProductsPage.expectRemoved(product.id, adminToken);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminProductsPage","homePage"]))('denies clients access to catalog administration', { tags: ['ai', 'scale'] }, async ({ adminProductsPage, homePage, agent }) => {
  // given
  await homePage.open();

  // when
  await adminProductsPage.open();

  // then
  await adminProductsPage.expectClientDenied();
  await adminProductsPage.expectDeniedMeaning(agent);
});
