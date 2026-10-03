import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/pages';
import { ADMIN_PASSWORD, ADMIN_USERNAME } from '../../test-config';

const admin = { username: ADMIN_USERNAME, password: ADMIN_PASSWORD };
const invalid = { username: 'invaliduser', password: 'invalidpassword' };

test.describe('Login screen', () => {
  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["loginPage","homePage"]))('signs in with valid credentials', { tags: ['ai', 'scale'] }, async ({ loginPage, homePage, agent }) => {
    // given
    await loginPage.open();
    await loginPage.fillCredentials(admin);

    // when
    await loginPage.submitWithAgent(agent);

    // then
    await homePage.expectUrl();
    await homePage.expectAuthenticated();
    await homePage.expectWelcomeMeaning(agent);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["loginPage"]))('requires credentials before signing in', { tags: ['ai', 'scale'] }, async ({ loginPage, agent }) => {
    // given
    await loginPage.open();

    // when
    await loginPage.submitWithAgent(agent);

    // then
    await loginPage.expectUrl();
    await loginPage.expectRequiredCredentials();
    await loginPage.expectMeaning(agent, 'required');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["loginPage"]))('shows a useful error for invalid credentials', { tags: ['ai', 'scale'] }, async ({ loginPage, agent }) => {
    // given
    await loginPage.open();
    await loginPage.fillCredentials(invalid);

    // when
    // The error toast expires quickly; trigger it without waiting for a model verdict.
    await loginPage.submit();

    // then
    await loginPage.toast.expectError('Invalid username/password');
    await loginPage.expectMeaning(agent, 'invalid');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["loginPage","registerPage"]))('opens registration from the form', { tags: ['ai', 'scale'] }, async ({ loginPage, registerPage, agent }) => {
    // given
    await loginPage.open();

    // when
    await loginPage.navigateWithAgent('register', agent);

    // then
    await registerPage.expectUrl();
    await registerPage.expectTitle();
    await registerPage.expectMeaning(agent, 'empty');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["loginPage","forgotPasswordPage"]))('opens password recovery', { tags: ['ai', 'scale'] }, async ({ loginPage, forgotPasswordPage, agent }) => {
    // given
    await loginPage.open();

    // when
    await loginPage.navigateWithAgent('recovery', agent);

    // then
    await forgotPasswordPage.expectUrl();
    await forgotPasswordPage.expectTitle();
  });

});
