import { requestFixture, pageFixture, type FixtureRegistry } from '../../support/fixtures';

import { randomUUID } from 'node:crypto';
import { fixtures as pagesTestFixtures, dependencies as pagesTestDependencies } from './pages';
import { fixtures as accountTestFixtures, dependencies as accountTestDependencies } from '../shared/account';
import { fixtures as adminSessionTestFixtures, dependencies as adminSessionTestDependencies } from '../shared/admin';
import type { Session } from '../shared/session';
import { APP_BASE_URL } from '../../test-config';

// Seed initial storage only: an init script would restore credentials after logout.
function storageState(session: Session) {
  return {
    cookies: [],
    origins: [{
      origin: new URL(APP_BASE_URL).origin,
      localStorage: [
        { name: 'token', value: session.token },
        { name: 'refreshToken', value: session.refreshToken },
        { name: 'clientSessionId', value: randomUUID() },
      ],
    }],
  };
}

export const fixtures = { ...pagesTestFixtures, ...accountTestFixtures, ...{
  storageState: async ({ account }, use) => {
    await use(storageState(account));
  },
} } satisfies FixtureRegistry;
export const dependencies = {  ...pagesTestDependencies, ...accountTestDependencies, storageState: ["account"] };

export const fixturesAdmin = { ...pagesTestFixtures, ...adminSessionTestFixtures, ...{
  storageState: async ({ adminSession }, use) => {
    await use(storageState(adminSession));
  },
} } satisfies FixtureRegistry;
export const dependenciesAdmin = {  ...pagesTestDependencies, ...adminSessionTestDependencies, storageState: ["adminSession"] };
