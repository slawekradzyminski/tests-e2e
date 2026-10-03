import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const adminTest = runner.extend<{ request: HttpClient }>({ request: requestFixture });
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixturesAdmin as adminTestFixtures, dependenciesAdmin as adminTestDependencies, fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/commerce';

adminTest.extend<Record<string, any>>(selectFixtures(adminTestFixtures, adminTestDependencies, ["editUserPage","usersPage","account","adminToken"]))('saves edits to a disposable user and returns to the directory', { tags: ['ai', 'scale'] }, async ({ editUserPage, usersPage, account, adminToken, agent }) => {
  // given
  const details = { email: `edited-${account.user.email}`, firstName: 'Edited', lastName: 'Customer' };
  await usersPage.open();
  await usersPage.edit(account.user.username);
  await editUserPage.expectValues(account.user);

  // when
  await editUserPage.saveWithAgent(details, agent);

  // then
  await usersPage.expectUrl();
  await usersPage.expectUser(account.user.username, details);
  await usersPage.expectUserMeaning(details, agent);
  await editUserPage.expectPersisted(account.user.username, adminToken, details);
});

adminTest.extend<Record<string, any>>(selectFixtures(adminTestFixtures, adminTestDependencies, ["editUserPage","usersPage","account","adminToken"]))('cancels a populated edit without saving it', { tags: ['ai', 'scale'] }, async ({ editUserPage, usersPage, account, adminToken, agent }) => {
  // given
  await editUserPage.open(account.user.username);
  await editUserPage.fill({ email: `unsaved-${account.user.email}`, firstName: 'Unsaved', lastName: 'Change' });

  // when
  await editUserPage.cancelWithAgent(agent);

  // then
  await usersPage.expectUrl();
  await usersPage.expectUser(account.user.username, account.user);
  await usersPage.expectUserMeaning(account.user, agent);
  await editUserPage.expectPersisted(account.user.username, adminToken, account.user);
});

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["editUserPage","account"]))('denies a client direct access to user editing', { tags: ['ai', 'scale'] }, async ({ editUserPage, account, agent }) => {
  // given
  const username = account.user.username;

  // when
  await editUserPage.open(username);

  // then
  await editUserPage.expectDenied();
  await editUserPage.expectDeniedMeaning(agent);
});
