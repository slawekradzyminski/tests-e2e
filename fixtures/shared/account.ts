import { requestFixture, pageFixture, type FixtureRegistry } from '../../support/fixtures';
import { expect } from 'e2e';
import { fixtures as baseFixtures, dependencies as baseDependencies } from './signup';
import { LoginClient } from '../../clients/users/login-client';
import { UserGenerator } from '../../generators/user-generator';
import type { UserRegisterDto } from '../../types/auth';
import { signIn, type Session } from './session';

export interface AccountSession extends Session {
  user: UserRegisterDto;
}

export const fixtures = { ...baseFixtures, ...{
  createAccount: async ({ request, signup }, use) => {
    const login = new LoginClient(request);
    await use(async (overrides = {}) => {
      const user = UserGenerator.generate(overrides);
      expect((await signup(user)).status(), 'Register fixture account').toBe(201);
      const session = await signIn(login, user, 'ROLE_CLIENT');
      return { user, ...session };
    });
  },
  account: async ({ createAccount }, use) => {
    await use(await createAccount());
  },
} } satisfies FixtureRegistry;
export const dependencies = {  ...baseDependencies, createAccount: ["request","signup"], account: ["createAccount"] };
