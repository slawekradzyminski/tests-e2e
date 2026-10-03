import { unique, type Agent } from 'e2e';
import { act, assertMeaning } from '../support/ai-evaluation';
import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import { UserByUsernameClient } from '../clients/users/user-by-username-client';
import { BasePage } from './base-page';
import { AuthenticatedHeader } from './components/authenticated-header';

export class UsersPage extends BasePage {
  readonly header: AuthenticatedHeader;

  constructor(page: Page) {
    super(page, '/users', 'users-page');
    this.header = new AuthenticatedHeader(page);
  }

  async expectVisible() {
    await expect(this.root).toBeVisible();
  }
  private user(username: string) {
    return this.root.getByTestId(/^user-item-/).filter({ has: this.page.screen.getByText(`Username: ${username}`, { exact: true }) });
  }
  async expectUser(username: string, details: { email: string; firstName: string; lastName: string }) {
    const user = this.user(username);
    await expect(user.getByTestId(/^user-name-/)).toHaveText(`${details.firstName} ${details.lastName}`);
    await expect(user.getByTestId(/^user-email-/)).toHaveText(details.email);
  }
  async expectClientCannotManage(username: string) {
    await expect(this.user(username)).toBeVisible();
    await expect(this.root.getByTestId(/^user-edit-/)).toHaveCount(0);
    await expect(this.root.getByTestId(/^user-delete-/)).toHaveCount(0);
  }
  async edit(username: string) { await this.user(username).getByTestId(/^user-edit-/).tap(); }
  async remove(username: string) {
    await this.page.browser.onDialog('accept');
    await this.user(username).getByTestId(/^user-delete-/).tap();
  }
  async expectRemoved(username: string, token: string) {
    await expect(this.user(username)).toHaveCount(0);
    expect((await new UserByUsernameClient(this.page.request).getByUsername(username, token)).status()).toBe(404);
  }

  async removeWithAgent(username: string, agent: Agent) {
    await this.page.browser.onDialog('accept');
    await act(agent, 'Delete only the disposable user {username} from the directory and confirm once. Leave every other account unchanged.', () => this.remove(username), { params: { username: unique(username) } });
  }
  async expectClientMeaning(agent: Agent) { await assertMeaning(agent, 'The users directory exposes contact and identity details but no Edit or Delete controls to this client.'); }
  async expectUserMeaning(details: {firstName: string; lastName: string; email: string}, agent: Agent) { await assertMeaning(agent, `The directory associates the name ${details.firstName} ${details.lastName} with email ${details.email} on the same user entry.`); }

}
