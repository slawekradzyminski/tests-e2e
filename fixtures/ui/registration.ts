import { requestFixture, pageFixture, type FixtureRegistry } from '../../support/fixtures';
import { expect } from 'e2e';
import { fixtures as pagesTestFixtures, dependencies as pagesTestDependencies } from './pages';
import { fixtures as signupTestFixtures, dependencies as signupTestDependencies } from '../shared/signup';
import { UserGenerator } from '../../generators/user-generator';
import type { UserRegisterDto } from '../../types/auth';

export const fixtures = { ...pagesTestFixtures, ...signupTestFixtures, ...{
  registrationUser: async ({ trackUser }, use) => {
    const user = UserGenerator.generate();
    // Track before the UI action, so a failure after creation still cleans up.
    trackUser(user.username);
    await use(user);
  },
  existingRegistrationUser: async ({ signup, registrationUser }, use) => {
    expect((await signup(registrationUser)).status()).toBe(201);
    await use(registrationUser);
  },
} } satisfies FixtureRegistry;
export const dependencies = {  ...pagesTestDependencies, ...signupTestDependencies, registrationUser: ["trackUser"], existingRegistrationUser: ["signup","registrationUser"] };
