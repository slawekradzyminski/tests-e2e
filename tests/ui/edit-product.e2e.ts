import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const adminTest = runner.extend<{ request: HttpClient }>({ request: requestFixture });
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixturesAdmin as adminTestFixtures, dependenciesAdmin as adminTestDependencies, fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/commerce';

adminTest.extend<Record<string, any>>(selectFixtures(adminTestFixtures, adminTestDependencies, ["adminProductFormPage","adminProductsPage","product","adminToken"]))('edits a disposable product and persists all catalog fields', { tags: ['ai', 'semantic', 'act-expansion', 'scale'] }, async ({ adminProductFormPage, adminProductsPage, product, adminToken, agent }) => {
  // given
  const values = { ...product, name: `Edited ${product.name}`, description: 'Updated description', price: 24.75, stockQuantity: 6 };
  await adminProductsPage.open();
  await adminProductsPage.edit(product.id);
  await adminProductFormPage.expectValues(product);

  // when
  await adminProductFormPage.editWithAgent(values, agent);

  // then
  await adminProductFormPage.expectPersisted(product.id, adminToken, values);
  await adminProductFormPage.openEdit(product.id);
  await adminProductFormPage.reload();
  await adminProductFormPage.expectValues(values);
  await adminProductsPage.open();
  await adminProductsPage.expectProduct(values);
  await adminProductsPage.expectEditedProductWithAgent(values, agent);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminProductFormPage","product"]))('denies clients access to editing an existing product', { tags: ['ai', 'scale'] }, async ({ adminProductFormPage, product, agent }) => {
  // given
  const productId = product.id;

  // when
  await adminProductFormPage.openEdit(productId);

  // then
  await adminProductFormPage.expectClientDenied();
  await adminProductFormPage.expectDeniedMeaning(agent);
});
