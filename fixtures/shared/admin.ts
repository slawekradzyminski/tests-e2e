import { requestFixture, pageFixture, type FixtureRegistry } from '../../support/fixtures';

import { LoginClient } from '../../clients/users/login-client';
import { ADMIN_PASSWORD, ADMIN_USERNAME } from '../../test-config';
import { signIn, type Session } from './session';

/** Lazy and test-scoped; shared by API setup, cleanup and admin UI contexts. */
export const fixtures = { request: requestFixture, page: pageFixture, ...{
  adminSession: async ({ request }, use) => {
    await use(await signIn(new LoginClient(request), {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    }, 'ROLE_ADMIN'));
  },
  adminToken: async ({ adminSession }, use) => {
    await use(adminSession.token);
  },
} } satisfies FixtureRegistry;
export const dependencies = { request: [], page: ["request"],  adminSession: ["request"], adminToken: ["adminSession"] };
