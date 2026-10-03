import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/registration';

test.describe('Registration screen', () => {
  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["registerPage","loginPage","registrationUser"]))('creates an account that can sign in', { tags: ['ai', 'scale'] }, async ({ registerPage, loginPage, registrationUser, agent }) => {
    // given
    await registerPage.open();
    await registerPage.fillDetails(registrationUser);

    // when
    await registerPage.submitWithAgent(agent);

    // then
    await loginPage.expectUrl();
    await loginPage.toast.expectSuccess('Registration successful! You can now log in.');
    await loginPage.expectMeaning(agent, 'empty');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["registerPage"]))('requires account details before registration', { tags: ['ai', 'scale'] }, async ({ registerPage, agent }) => {
    // given
    await registerPage.open();

    // when
    await registerPage.submitWithAgent(agent);

    // then
    await registerPage.expectUrl();
    await registerPage.expectRequiredDetails();
    await registerPage.expectMeaning(agent, 'required');
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["registerPage","existingRegistrationUser"]))('rejects an existing username', { tags: ['ai', 'scale'] }, async ({ registerPage, existingRegistrationUser, agent }) => {
    // given
    await registerPage.open();
    await registerPage.fillDetails({ ...existingRegistrationUser, email: `other_${existingRegistrationUser.email}` });

    // when
    await registerPage.submitWithAgent(agent);

    // then
    await registerPage.toast.expectError('Username already exists');
    await registerPage.expectMeaning(agent, 'duplicate');
    await registerPage.expectUrl();
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["registerPage","loginPage"]))('opens sign in for an existing account', { tags: ['ai', 'scale'] }, async ({ registerPage, loginPage, agent }) => {
    // given
    await registerPage.open();

    // when
    await registerPage.loginWithAgent(agent);

    // then
    await loginPage.expectUrl();
    await loginPage.header.expectVisible();
    await loginPage.expectMeaning(agent, 'empty');
  });
});
