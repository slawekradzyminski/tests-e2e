import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('Sonnet can navigate from login to registration', { tags: ['smoke', 'ai'] }, async ({ app, agent, screen, browser }) => {
  // given
  await app.open('/login');
  await expect(screen.getByTestId('login-page')).toBeVisible();

  // when
  await agent.act('Go to the registration page using the Register link. Do not submit or create an account.');

  // then
  await expect(browser).toHaveURL('/register');
  await expect(screen.getByTestId('register-page')).toBeVisible();
});
