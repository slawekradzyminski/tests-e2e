import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const adminTest = runner.extend<{ request: HttpClient }>({ request: requestFixture });
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixturesAdmin as adminTestFixtures, dependenciesAdmin as adminTestDependencies, fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/commerce';

adminTest.extend<Record<string, any>>(selectFixtures(adminTestFixtures, adminTestDependencies, ["adminInventoryPage","product","adminToken"]))('selects a product and records a stock adjustment with movement history', { tags: ['ai', 'semantic', 'act-expansion', 'scale', 'challenge', 'four-operations'] }, async ({ adminInventoryPage, product, adminToken, agent }) => {
  // given
  await adminInventoryPage.open();
  await adminInventoryPage.selectWithAgent(product.id, product.name, agent);
  await adminInventoryPage.expectSelected(product.name, 10);

  // when
  await adminInventoryPage.adjustWithAgent(agent);

  // then
  await adminInventoryPage.waitForAdjustmentWithAgent(agent);
  await adminInventoryPage.expectSelected(product.name, 13);
  await adminInventoryPage.expectMovement('Received three replacement units', 3);
  await adminInventoryPage.expectAdjustmentWithAgent(agent);
  await adminInventoryPage.expectExtractedAdjustment(agent);
  await adminInventoryPage.challengeHiddenPersistence(product.id, adminToken, agent);
  await adminInventoryPage.expectPersisted(product.id, adminToken, 13, 'Received three replacement units', 3);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["adminInventoryPage","homePage","product"]))('denies clients access to inventory administration', { tags: ['ai', 'scale'] }, async ({ adminInventoryPage, homePage, product, agent }) => {
  // given
  await homePage.open();

  // when
  await adminInventoryPage.open();

  // then
  await adminInventoryPage.expectClientDenied();
  await adminInventoryPage.expectMeaning(agent, 'The authenticated home page is displayed with a welcome card and Logout. No inventory product inspector, quantity-adjustment form, Apply adjustment button, or movement-history panel is displayed.');

  // when
  await adminInventoryPage.openProduct(product.id);

  // then
  await adminInventoryPage.expectClientDenied();
  await adminInventoryPage.expectMeaning(agent, 'The authenticated home page is displayed with a welcome card and Logout. No inventory product inspector, quantity-adjustment form, Apply adjustment button, or movement-history panel is displayed.');
});
