import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const clientTest = runner.extend<{ request: HttpClient }>({ request: requestFixture });
const adminTest = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixtures as clientTestFixtures, dependencies as clientTestDependencies, fixturesAdmin as adminTestFixtures, dependenciesAdmin as adminTestDependencies } from '../../fixtures/ui/authenticated';

clientTest.describe('Authenticated header — client', () => {
  clientTest.extend<Record<string, any>>(selectFixtures(clientTestFixtures, clientTestDependencies, ["homePage","productsPage"]))('opens products', { tags: ['ai', 'scale'] }, async ({ homePage, productsPage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.header.goToProducts(agent);

    // then
    await productsPage.expectUrl();
    await productsPage.expectVisible();
    await productsPage.expectMeaning(agent, 'The product catalog offers search, categories, sorting and product cards for shopping.');
  });

  clientTest.extend<Record<string, any>>(selectFixtures(clientTestFixtures, clientTestDependencies, ["homePage","emailPage"]))('opens Send Email', { tags: ['ai', 'scale'] }, async ({ homePage, emailPage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.header.goToSendEmail(agent);

    // then
    await emailPage.expectUrl();
    await emailPage.expectVisible();
    await emailPage.expectMeaning(agent, 'Send Email provides a form for composing and sending an email.');
  });

  clientTest.extend<Record<string, any>>(selectFixtures(clientTestFixtures, clientTestDependencies, ["homePage","qrCodePage"]))('opens QR Code', { tags: ['ai', 'scale'] }, async ({ homePage, qrCodePage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.header.goToQrCode(agent);

    // then
    await qrCodePage.expectUrl();
    await qrCodePage.expectVisible();
    await qrCodePage.expectMeaning(agent, 'The QR code generator provides an input and an action to generate a QR code.');
  });

  clientTest.extend<Record<string, any>>(selectFixtures(clientTestFixtures, clientTestDependencies, ["homePage","llmPage"]))('opens LLM', { tags: ['ai', 'scale'] }, async ({ homePage, llmPage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.header.goToLlm(agent);

    // then
    await llmPage.expectUrl();
    await llmPage.expectVisible();
    await llmPage.expectMeaning(agent, 'The LLM workspace landing page offers Generate, Chat, and Chat + Tools modes with links to each mode.');
  });

  clientTest.extend<Record<string, any>>(selectFixtures(clientTestFixtures, clientTestDependencies, ["homePage","trafficMonitorPage"]))('opens Traffic Monitor', { tags: ['ai', 'scale'] }, async ({ homePage, trafficMonitorPage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.header.goToTrafficMonitor(agent);

    // then
    await trafficMonitorPage.expectUrl();
    await trafficMonitorPage.expectVisible();
    await trafficMonitorPage.expectMeaning(agent, 'Traffic Monitor provides request monitoring controls and request information.');
  });

  clientTest.extend<Record<string, any>>(selectFixtures(clientTestFixtures, clientTestDependencies, ["homePage","cartPage"]))('opens the cart', { tags: ['ai', 'scale'] }, async ({ homePage, cartPage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.header.goToCart(agent);

    // then
    await cartPage.expectUrl();
    await cartPage.expectVisible();
    await cartPage.expectMeaning(agent, 'The shopping cart screen provides the current cart or an explicit empty state.');
  });

  clientTest.extend<Record<string, any>>(selectFixtures(clientTestFixtures, clientTestDependencies, ["homePage","profilePage"]))('opens the user profile', { tags: ['ai', 'scale'] }, async ({ homePage, profilePage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.header.goToProfile(agent);

    // then
    await profilePage.expectUrl();
    await profilePage.expectVisible();
    await profilePage.expectMeaning(agent, 'The profile screen offers personal information, separate assistant prompts and order history.');
  });

  clientTest.extend<Record<string, any>>(selectFixtures(clientTestFixtures, clientTestDependencies, ["homePage","productsPage"]))('returns home through the brand', { tags: ['ai', 'scale'] }, async ({ homePage, productsPage, agent }) => {
    // given
    await productsPage.open();

    // when
    await productsPage.header.goHome(agent);

    // then
    await homePage.expectUrl();
    await homePage.expectAuthenticated();
    await homePage.expectWelcomeMeaning(agent);
  });

  clientTest.extend<Record<string, any>>(selectFixtures(clientTestFixtures, clientTestDependencies, ["homePage","loginPage"]))('logs out and prevents reopening home', { tags: ['ai', 'scale'] }, async ({ homePage, loginPage, agent }) => {
    // given
    await homePage.open();
    await homePage.expectAuthenticated();
    await homePage.expectWelcomeMeaning(agent);

    // when
    await homePage.header.logout(agent);

    // then
    await loginPage.expectUrl();
    await loginPage.header.expectVisible();
    await loginPage.header.expectSessionCleared();
    await homePage.open();
    await loginPage.expectUrl();
    await loginPage.header.expectVisible();
  });
});

clientTest.describe('Authenticated header — client permissions', () => {
  clientTest.extend<Record<string, any>>(selectFixtures(clientTestFixtures, clientTestDependencies, ["homePage","account"]))('identifies the signed-in user', { tags: ['ai', 'scale'] }, async ({ homePage, account, agent }) => {
    // given
    const { firstName, lastName } = account.user;

    // when
    await homePage.open();

    // then
    await homePage.header.expectVisible();
    await homePage.header.expectUser(firstName, lastName);
    await homePage.header.expectMeaning(agent, `The signed-in profile link identifies ${firstName} ${lastName}, and Logout is available.`);
  });

  clientTest.extend<Record<string, any>>(selectFixtures(clientTestFixtures, clientTestDependencies, ["homePage"]))('does not expose the Admin link', { tags: ['ai', 'scale'] }, async ({ homePage, agent }) => {
    // given
    await homePage.open();
    await homePage.expectAuthenticated();
    await homePage.expectWelcomeMeaning(agent);

    // when
    await homePage.reload();

    // then
    await homePage.header.expectAdminLinkAbsent();
    await homePage.header.expectMeaning(agent, 'The signed-in client navigation has no Admin link, while ordinary product and utility links remain available.');
  });
});

adminTest.describe('Authenticated header — admin permissions', () => {
  adminTest.extend<Record<string, any>>(selectFixtures(adminTestFixtures, adminTestDependencies, ["homePage","adminDashboardPage"]))('shows the Admin link and opens the dashboard', { tags: ['ai', 'scale'] }, async ({ homePage, adminDashboardPage, agent }) => {
    // given
    await homePage.open();

    // when
    await homePage.header.goToAdmin(agent);

    // then
    await homePage.header.expectAdminLinkVisible();
    await adminDashboardPage.expectUrl();
    await adminDashboardPage.expectVisible();
    await adminDashboardPage.expectMeaning(agent, 'The admin dashboard provides product, order and inventory administration information.');
  });
});
