import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { expect } from 'e2e';
import { LoginClient } from '../../../clients/users/login-client';
import { expectSuccessfulLogin } from '../../../validators/login-response-validator';
import { ADMIN_PASSWORD, ADMIN_USERNAME } from '../../../test-config';

const validCredentials = { username: ADMIN_USERNAME, password: ADMIN_PASSWORD };

test.describe('/api/v1/users/signin API tests', () => {
  let loginClient: LoginClient;

  test.beforeEach(async ({ request }) => {
    // given
    loginClient = new LoginClient(request);
  });

  test('should successfully authenticate with valid credentials - 200', async () => {
    // given
    const credentials = validCredentials;

    // when
    const response = await loginClient.login(credentials);

    // then
    expect(response.status()).toBe(200);
    expectSuccessfulLogin(await response.json(), validCredentials.username);
  });

  const validationCases = [
    { name: 'empty username', credentials: { ...validCredentials, username: '' }, field: 'username' },
    { name: 'username too short', credentials: { ...validCredentials, username: 'abc' }, field: 'username' },
    { name: 'password too short', credentials: { ...validCredentials, password: 'abc' }, field: 'password' },
  ] as const;

  for (const { name, credentials, field } of validationCases) {
    test(`should return validation error for ${name} - 400`, async () => {
      // given
      const payload = credentials;

      // when
      const response = await loginClient.login(payload);

      // then
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({
        [field]: `Minimum ${field} length: 4 characters`,
      });
    });
  }

  test('should return authentication error for both invalid credentials - 422', async () => {
    // given
    const credentials = { username: 'wronguser', password: 'wrongpassword' };

    // when
    const response = await loginClient.login(credentials);

    // then
    expect(response.status()).toBe(422);
    expect(await response.json()).toEqual({ message: 'Invalid username/password supplied' });
  });
});
