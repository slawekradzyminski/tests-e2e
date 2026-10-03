import { act, assertMeaning } from '../../support/ai-evaluation';
import type { Agent } from 'e2e';
import type { PageContext as Page } from '../../support/fixtures';

import { expect, type Locator } from 'e2e';

export class LoggedOutHeader {
  private readonly root: Locator;

  constructor(private readonly page: Page) {
    this.root = page.screen.getByTestId('navigation');
  }

  async goToRegister(agent?: Agent): Promise<void> {
    if (agent) { await act(agent, 'Open registration using Register in the navigation.', () => this.goToRegister()); return; }
    await this.root.getByTestId('register-link').tap();
  }

  async goToLogin(agent?: Agent): Promise<void> {
    if (agent) { await act(agent, 'Open sign in using Login in the navigation.', () => this.goToLogin()); return; }
    await this.root.getByTestId('login-link').tap();
  }

  async goHome(agent?: Agent): Promise<void> {
    if (agent) { await act(agent, 'Return home using the Awesome Testing brand link.', () => this.goHome()); return; }
    await this.root.getByTestId('brand-link').tap();
  }

  async expectSessionCleared() {
    await expect.poll(() => this.page.browser.evaluate(() => ({
      token: localStorage.getItem('token'),
      refreshToken: localStorage.getItem('refreshToken'),
    }))).toEqual({ token: null, refreshToken: null });
  }

  async expectVisible() {
    await expect(this.root.getByTestId('login-link')).toBeVisible();
    await expect(this.root.getByTestId('register-link')).toBeVisible();
    await expect(this.root.getByTestId('logout-button')).toBeHidden();
    await expect(this.root.getByTestId('username-profile-link')).toBeHidden();
  }
  async expectMeaning(agent: Agent, statement: string) { await assertMeaning(agent, statement); }

}
