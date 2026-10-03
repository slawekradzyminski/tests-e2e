import { requestFixture, pageFixture, type FixtureRegistry } from '../../support/fixtures';
import { expect } from 'e2e';
import { fixtures as baseFixtures, dependencies as baseDependencies } from './admin';
import { SignupClient } from '../../clients/users/signup-client';
import { DeleteUserClient } from '../../clients/users/delete-user-client';
import type { UserRegisterDto } from '../../types/auth';

export const fixtures = { ...baseFixtures, ...{
  trackUser: async ({ request, adminToken }, use) => {
    const remove = new DeleteUserClient(request);
    const usernames = new Set<string>();
    try {
      await use((username: string) => usernames.add(username));
    } finally {
      for (const username of usernames) {
        const response = await remove.deleteUser(username, adminToken);
        // Tests may delete the account themselves; UI registration may never create it.
        expect.soft([204, 404], `Cleanup of ${username}`).toContain(response.status());
      }
    }
  },
  signup: async ({ request, trackUser }, use) => {
    const client = new SignupClient(request);
    await use(async (user: UserRegisterDto) => {
      const response = await client.signup(user);
      if (response.status() === 201) trackUser(user.username);
      return response;
    });
  },
} } satisfies FixtureRegistry;
export const dependencies = {  ...baseDependencies, trackUser: ["request","adminToken"], signup: ["request","trackUser"] };
