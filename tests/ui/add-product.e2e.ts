import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const adminTest = runner.extend<{ request: HttpClient }>({ request: requestFixture });
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixturesAdmin as adminTestFixtures, dependenciesAdmin as adminTestDependencies, fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/commerce';

adminTest.extend<Record<string, any>>(selectFixtures(adminTestFixtures, adminTestDependencies, ["adminProductFormPage","adminProductsPage","shop","adminToken"]))('creates a product and exposes its saved values in the admin catalog', { tags: ['ai', 'scale'] }, async ({ adminProductFormPage, adminProductsPage, shop, adminToken, agent }) => {
  // given
  const values = { name: `New ${shop.category}`, description: 'Created through the product form', price: 19.75, stockQuantity: 7, category: shop.category };
  await adminProductFormPage.openNew();
  await adminProductFormPage.fill(values);

  // when
  const product = await adminProductFormPage.createWithAgent(agent);

  // then
  await adminProductFormPage.expectReset();
  await adminProductFormPage.expectPersisted(product.id, adminToken, values);
  await adminProductsPage.open();
  await adminProductsPage.expectProduct({ ...product, ...values });
  await adminProductsPage.expectProductMeaning({ ...product, ...values }, agent);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminProductFormPage","homePage"]))('denies clients access to product creation', { tags: ['ai', 'scale'] }, async ({ adminProductFormPage, homePage, agent }) => {
  // given
  await homePage.open();

  // when
  await adminProductFormPage.openNew();

  // then
  await adminProductFormPage.expectClientDenied();
  await adminProductFormPage.expectDeniedMeaning(agent);
});
