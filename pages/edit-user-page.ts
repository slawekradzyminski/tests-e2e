import { unique, type Agent } from 'e2e';
import { act, assertMeaning } from '../support/ai-evaluation';
import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import { APP_BASE_URL } from '../test-config';
import { UserByUsernameClient } from '../clients/users/user-by-username-client';

type Details = { email: string; firstName: string; lastName: string };
export class EditUserPage {
  constructor(private readonly page: Page) {}
  async open(username: string) { await this.page.browser.goto(`${APP_BASE_URL}/users/${encodeURIComponent(username)}/edit`); }
  async fill(details: Details) {
    for (const [field, value] of Object.entries({ email: details.email, firstName: details.firstName, lastName: details.lastName })) await this.page.screen.getByTestId(`edit-user-${field.toLowerCase()}-input`).fill(value);
  }
  async save() { await this.page.screen.getByTestId('edit-user-submit-button').tap(); }
  async cancel() { await this.page.screen.getByTestId('edit-user-cancel-button').tap(); }
  async expectDenied() {
    await expect(this.page.screen.getByTestId('edit-user-denied')).toHaveText('Access denied');
    await expect(this.page.screen.getByTestId('edit-user-form')).toHaveCount(0);
  }
  async expectValues(details: Details) {
    for (const [field, value] of Object.entries({ email: details.email, firstName: details.firstName, lastName: details.lastName })) await expect(this.page.screen.getByTestId(`edit-user-${field.toLowerCase()}-input`)).toHaveValue(value);
  }
  async expectPersisted(username: string, token: string, details: Details) {
    const response = await new UserByUsernameClient(this.page.request).getByUsername(username, token);
    expect(response.status()).toBe(200);
    const { email, firstName, lastName } = details;
    expect(await response.json()).toMatchObject({ email, firstName, lastName });
  }
  async saveWithAgent(details: Details, agent: Agent) { await act(agent, 'Update this disposable user to email {email}, first name {firstName} and last name {lastName}; save once and return to the users directory.', async () => { await this.fill(details); await this.save(); }, { params: { ...details, email: unique(details.email) } }); }
  async cancelWithAgent(agent: Agent) { await act(agent, 'Cancel this populated user edit without saving it and return to the directory.', () => this.cancel()); }
  async expectDeniedMeaning(agent: Agent) { await assertMeaning(agent, 'Access to user editing is denied and no editable user form is exposed.'); }

}
