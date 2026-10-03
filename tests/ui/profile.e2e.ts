import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { shippingAddress, fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/commerce';

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["profilePage","account"]))('saves personal information and both assistant prompts across reload', { tags: ['ai', 'semantic', 'scale', 'challenge'] }, async ({ profilePage, account, agent }) => {
  // given
  const details = { email: `updated-${account.user.email}`, firstName: 'Updated', lastName: 'Customer' };
  await profilePage.open();

  // when
  await profilePage.personalDetailsWithAgent(details, agent);

  // then
  await profilePage.toast.expectSuccess('User information updated successfully');
  await profilePage.expectPersistedDetails(account.user.username, account.token, details);
  await profilePage.reload();
  await profilePage.expectPersonalDetails(details);
  await profilePage.expectDetailsMeaning(agent);

  // when
  await profilePage.promptsWithAgent(agent);

  // then
  await profilePage.toast.expectSuccess('Chat system prompt updated successfully');
  await profilePage.toast.expectSuccess('Tool system prompt updated successfully');
  await profilePage.reload();
  await profilePage.expectPrompts('Answer briefly using supplied context.', 'Use tools to verify product availability.');
  await profilePage.expectPromptMeaningWithAgent(agent);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["profilePage","orderDetailsPage","order","product"]))('filters order history and opens the matching order', { tags: ['ai', 'scale'] }, async ({ profilePage, orderDetailsPage, order, product, agent }) => {
  // given
  await profilePage.open();
  await profilePage.expectOrder(order);

  // when
  await profilePage.filterWithAgent('CANCELLED', agent);

  // then
  await profilePage.expectNoOrders();
  await profilePage.expectHistoryMeaning(agent, true);

  // when
  await profilePage.filterWithAgent('PENDING', agent);

  // then
  await profilePage.expectOrder(order);

  // when
  await profilePage.viewWithAgent(order.id, agent);

  // then
  await orderDetailsPage.expectUrl(order.id);
  await orderDetailsPage.expectOrder(order.id, product, 2, shippingAddress);
});
