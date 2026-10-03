import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/authenticated';

test.describe('Home screen', () => {
  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["homePage","account"]))('shows the API-authenticated user after a reload', { tags: ['ai', 'scale'] }, async ({ homePage, account, agent }) => {
    // given
    await homePage.open();
    await homePage.expectWelcome(account.user);
    await homePage.expectWelcomeMeaning(agent);

    // when
    await homePage.reload();

    // then
    await homePage.expectUrl();
    await homePage.expectWelcome(account.user);
    await homePage.expectWelcomeMeaning(agent);
    await homePage.header.expectUser(account.user.firstName, account.user.lastName);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["homePage","productsPage"]))('opens the product catalog', { tags: ['ai', 'scale'] }, async ({ homePage, productsPage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.navigateWithAgent('products', agent);

    // then
    await productsPage.expectUrl();
    await productsPage.expectVisible();
    await productsPage.expectMeaning(agent, 'The product catalog offers search, categories, sorting and product cards for shopping.');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["homePage","profilePage"]))('opens profile and orders', { tags: ['ai', 'scale'] }, async ({ homePage, profilePage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.navigateWithAgent('profile', agent);

    // then
    await profilePage.expectUrl();
    await profilePage.expectVisible();
    await profilePage.expectMeaning(agent, 'The profile screen offers personal information, separate assistant prompts and order history.');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["homePage","usersPage"]))('opens the users directory', { tags: ['ai', 'scale'] }, async ({ homePage, usersPage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.navigateWithAgent('users', agent);

    // then
    await usersPage.expectUrl();
    await usersPage.expectVisible();
    await usersPage.expectMeaning(agent, 'The users directory lists user identities and contact details.');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["homePage","llmPage"]))('opens the AI assistant', { tags: ['ai', 'scale'] }, async ({ homePage, llmPage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.navigateWithAgent('assistant', agent);

    // then
    await llmPage.expectUrl();
    await llmPage.expectVisible();
    await llmPage.expectMeaning(agent, 'The LLM workspace landing page offers Generate, Chat, and Chat + Tools modes with links to each mode.');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["homePage","trafficMonitorPage"]))('opens Traffic Monitor', { tags: ['ai', 'scale'] }, async ({ homePage, trafficMonitorPage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.navigateWithAgent('traffic', agent);

    // then
    await trafficMonitorPage.expectUrl();
    await trafficMonitorPage.expectVisible();
    await trafficMonitorPage.expectMeaning(agent, 'Traffic Monitor provides request monitoring controls and request information.');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["homePage","qrCodePage"]))('opens the QR code generator', { tags: ['ai', 'scale'] }, async ({ homePage, qrCodePage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.navigateWithAgent('qr', agent);

    // then
    await qrCodePage.expectUrl();
    await qrCodePage.expectVisible();
    await qrCodePage.expectMeaning(agent, 'The QR code generator provides an input and an action to generate a QR code.');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["homePage","emailPage"]))('opens Send Email', { tags: ['ai', 'scale'] }, async ({ homePage, emailPage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.navigateWithAgent('email', agent);

    // then
    await emailPage.expectUrl();
    await emailPage.expectVisible();
    await emailPage.expectMeaning(agent, 'Send Email provides a form for composing and sending an email.');
  });
});
