import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/signup';
import { UserGenerator } from '../../../generators/user-generator';

test.describe('/api/v1/users/signup API tests', () => {
  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["signup"]))('should create an account with valid data - 201', async ({ signup }) => {
    // given
    const user = UserGenerator.generate();

    // when
    const response = await signup(user);

    // then
    expect(response.status()).toBe(201);
    expect(await response.text()).toBe('');
  });

  const validationCases = [
    { name: 'empty username', overrides: { username: '' }, field: 'username', message: 'Minimum username length: 4 characters' },
    { name: 'short password', overrides: { password: 'abc' }, field: 'password', message: 'Minimum password length: 8 characters' },
    { name: 'invalid email', overrides: { email: 'invalid' }, field: 'email', message: 'Email should be valid' },
  ] as const;

  for (const { name, overrides, field, message } of validationCases) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["signup"]))(`should reject ${name} - 400`, async ({ signup }) => {
      // given
      const user = UserGenerator.generate(overrides);

      // when
      const response = await signup(user);

      // then
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ [field]: message });
    });
  }

  const duplicateCases = [
    { field: 'username', message: 'Username is already in use' },
    { field: 'email', message: 'Email is already in use' },
  ] as const;

  for (const { field, message } of duplicateCases) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["signup"]))(`should reject duplicate ${field} - 400`, async ({ signup }) => {
      // given
      const original = UserGenerator.generate();
      expect((await signup(original)).status()).toBe(201);
      const duplicate = UserGenerator.generate({ [field]: original[field] });

      // when
      const response = await signup(duplicate);

      // then
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ message });
    });
  }
});
