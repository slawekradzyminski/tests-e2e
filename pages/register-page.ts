import { act, assertMeaning } from '../support/ai-evaluation';
import type { Agent } from 'e2e';
import { secrets } from 'e2e';
import { setFormPassword } from '../support/passwords';
import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import type { UserRegisterDto } from '../types/auth';
import { Toast } from './components/toast';
import { BasePage } from './base-page';
import { LoggedOutHeader } from './components/logged-out-header';

export class RegisterPage extends BasePage {
  readonly header: LoggedOutHeader;
  readonly toast: Toast;

  constructor(page: Page) {
    super(page, '/register', 'register-page');
    this.header = new LoggedOutHeader(page);
    this.toast = new Toast(page);
  }

  async fillDetails(user: UserRegisterDto) {
    await this.root.getByTestId('register-username-input').fill(user.username);
    await this.root.getByTestId('register-email-input').fill(user.email);
    setFormPassword(user.password);
    await this.root.getByTestId('register-password-input').fill(secrets.get('form-password'));
    await this.root.getByTestId('register-firstname-input').fill(user.firstName);
    await this.root.getByTestId('register-lastname-input').fill(user.lastName);
  }

  async submit() {
    await this.root.getByTestId('register-submit-button').tap();
  }

  async goToLogin() {
    await this.root.getByTestId('register-login-link').tap();
  }

  async expectRequiredDetails() {
    await expect(this.root.getByTestId('register-username-error')).toHaveText('Username is required');
    await expect(this.root.getByTestId('register-email-error')).toHaveText('Email is required');
    await expect(this.root.getByTestId('register-password-error')).toHaveText('Password is required');
    await expect(this.root.getByTestId('register-firstname-error')).toHaveText('First name is required');
    await expect(this.root.getByTestId('register-lastname-error')).toHaveText('Last name is required');
  }

  async expectTitle() {
    await expect(this.root.getByTestId('register-title')).toHaveText('Create your account');
  }
  async submitWithAgent(agent: Agent) {
    await act(agent, 'Submit the current registration form exactly once. Stop at the resulting page or validation errors; do not change any supplied inputs.', () => this.submit());
  }
  async loginWithAgent(agent: Agent) { await act(agent, 'Open sign in for an existing account using the registration form link.', () => this.goToLogin()); }
  async expectMeaning(agent: Agent, state: 'empty' | 'required' | 'duplicate') {
    const goals = { empty: 'Account registration requests username, email, password, first name and last name, and offers sign in for an existing account.', required: 'All five required account details have validation feedback and the user remains on registration.', duplicate: 'The registration error explains that the username already exists and the account form remains available.' };
    await assertMeaning(agent, goals[state]);
  }

}
