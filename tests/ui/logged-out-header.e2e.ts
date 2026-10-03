import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/pages';

test.describe('Logged-out header', () => {
  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["homePage","loginPage"]))('redirects a guest from home to sign in', { tags: ['ai', 'scale'] }, async ({ homePage, loginPage, agent }) => {
    // given
    await loginPage.open();

    // when
    await homePage.open();

    // then
    await loginPage.expectUrl();
    await loginPage.header.expectVisible();
    await loginPage.expectMeaning(agent, 'empty');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["loginPage","registerPage"]))('opens registration', { tags: ['ai', 'scale'] }, async ({ loginPage, registerPage, agent }) => {
    // given
    await loginPage.open();

    // when
    await loginPage.header.goToRegister(agent);

    // then
    await registerPage.expectUrl();
    await registerPage.expectTitle();
    await registerPage.expectMeaning(agent, 'empty');
    await registerPage.header.expectVisible();
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["registerPage","loginPage"]))('opens login from registration', { tags: ['ai', 'scale'] }, async ({ registerPage, loginPage, agent }) => {
    // given
    await registerPage.open();

    // when
    await registerPage.header.goToLogin(agent);

    // then
    await loginPage.expectUrl();
    await loginPage.header.expectVisible();
    await loginPage.expectMeaning(agent, 'empty');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["registerPage","loginPage"]))('returns to login through the brand', { tags: ['ai', 'scale'] }, async ({ registerPage, loginPage, agent }) => {
    // given
    await registerPage.open();

    // when
    await registerPage.header.goHome(agent);

    // then
    await loginPage.expectUrl();
    await loginPage.header.expectVisible();
    await loginPage.expectMeaning(agent, 'empty');
  });
});
