import { act, assertMeaning } from '../support/ai-evaluation';
import type { Agent } from 'e2e';
import { secrets } from 'e2e';
import { setFormPassword } from '../support/passwords';
import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';

import type { LoginDto } from '../types/auth';
import { BasePage } from './base-page';
import { LoggedOutHeader } from './components/logged-out-header';
import { Toast } from './components/toast';

export class LoginPage extends BasePage {
  readonly header: LoggedOutHeader;
  readonly toast: Toast;
  private readonly username;
  private readonly password;
  private readonly submitButton;

  constructor(page: Page) {
    super(page, '/login', 'login-page');
    this.header = new LoggedOutHeader(page);
    this.toast = new Toast(page);
    this.username = this.root.getByTestId('login-username-input');
    this.password = this.root.getByTestId('login-password-input');
    this.submitButton = this.root.getByTestId('login-submit-button');
  }

  async fillCredentials(credentials: LoginDto) {
    await this.username.fill(credentials.username);
    setFormPassword(credentials.password);
    await this.password.fill(secrets.get('form-password'));
  }

  async submit() {
    await this.submitButton.tap();
  }

  async signIn(credentials: LoginDto) {
    await this.fillCredentials(credentials);
    await this.submit();
  }

  async goToRegister() {
    await this.root.getByTestId('login-register-link').tap();
  }

  async goToPasswordRecovery() {
    await this.root.getByTestId('login-forgot-link').tap();
  }

  async expectRequiredCredentials() {
    await expect(this.root.getByTestId('login-username-error')).toHaveText('Username is required');
    await expect(this.root.getByTestId('login-password-error')).toHaveText('Password is required');
  }

  async submitWithAgent(agent: Agent) {
    await act(agent, 'Submit the current login form once. If validation or an authentication error appears, stop and leave it visible; do not fix the supplied inputs.', () => this.submit());
  }
  async navigateWithAgent(destination: 'register' | 'recovery', agent: Agent) {
    await act(agent, destination === 'register' ? 'Open registration using the link in the login form.' : 'Open password recovery using Forgot your password?', () => destination === 'register' ? this.goToRegister() : this.goToPasswordRecovery());
  }
  async expectMeaning(agent: Agent, state: 'empty' | 'required' | 'invalid') {
    const goals = { empty: 'The page offers a username-and-password sign-in form and routes to account registration and password recovery.', required: 'Both username and password are identified as required; the user remains on the sign-in form.', invalid: 'An authentication error explains that the supplied username/password is invalid; the sign-in form remains available for recovery.' };
    await assertMeaning(agent, goals[state]);
  }

}
