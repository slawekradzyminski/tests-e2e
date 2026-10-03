import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../support/http';
import { requestFixture, selectFixtures } from '../../support/fixtures';
const adminTest = runner.extend<{ request: HttpClient }>({ request: requestFixture });
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { fixturesAdmin as adminTestFixtures, dependenciesAdmin as adminTestDependencies, fixtures as testFixtures, dependencies as testDependencies } from '../../fixtures/ui/commerce';

test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["usersPage","account"]))('shows the directory without admin edit or delete controls for clients', { tags: ['ai', 'scale'] }, async ({ usersPage, account, agent }) => {
  // given
  const user = account.user;

  // when
  await usersPage.open();

  // then
  await usersPage.expectUser(user.username, user);
  await usersPage.expectUserMeaning(user, agent);
  await usersPage.expectClientCannotManage(user.username);
  await usersPage.expectClientMeaning(agent);
});

adminTest.extend<Record<string, any>>(selectFixtures(adminTestFixtures, adminTestDependencies, ["usersPage","account","adminToken"]))('deletes a disposable user from the directory', { tags: ['ai', 'scale'] }, async ({ usersPage, account, adminToken, agent }) => {
  // given
  await usersPage.open();
  await usersPage.expectUser(account.user.username, account.user);

  // when
  await usersPage.removeWithAgent(account.user.username, agent);

  // then
  await usersPage.expectRemoved(account.user.username, adminToken);
});
