import { challengeHomeNavigation } from '../support/challenges';
import { act, assertMeaning } from '../support/ai-evaluation';
import type { Agent } from 'e2e';
import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import { BasePage } from './base-page';
import { AuthenticatedHeader } from './components/authenticated-header';

export class HomePage extends BasePage {
  readonly header: AuthenticatedHeader;

  constructor(page: Page) {
    super(page, '/', 'home-page');
    this.header = new AuthenticatedHeader(page);
  }

  async reload() {
    await this.page.browser.reload();
  }

  async expectWelcome(user: { firstName: string; email: string }) {
    await expect(this.root.getByTestId('home-welcome-title')).toHaveText(`Welcome, ${user.firstName}!`);
    // Match the stored DOM text: e2e observes CSS-transformed text, while the original contract uses textContent.
    await expect.poll(() => this.page.browser.evaluate(() => document.querySelector('[data-testid="home-user-email"]')?.textContent?.trim() ?? null)).toBe(user.email);
  }

  async goToProducts() {
    await this.root.getByTestId('home-products-button').tap();
  }

  async goToProfile() {
    await this.root.getByTestId('home-profile-button').tap();
  }

  async goToUsers() {
    await this.root.getByTestId('home-users-button').tap();
  }

  async goToLlm() {
    await this.root.getByTestId('home-llm-button').tap();
  }

  async goToTrafficMonitor() {
    await this.root.getByTestId('home-traffic-button').tap();
  }

  async goToQrCode() {
    await this.root.getByTestId('home-qr-button').tap();
  }

  async goToEmail() {
    await this.root.getByTestId('home-email-button').tap();
  }

  async expectAuthenticated() {
    await expect(this.root.getByTestId('home-welcome-title')).toHaveText(/^Welcome, .+!$/);
    await this.header.expectVisible();
  }
  async navigateWithAgent(destination: string, agent: Agent) {
    if (destination === 'products' && await challengeHomeNavigation(this.page, agent)) return;
    const flows: Record<string, () => Promise<void>> = { products: () => this.goToProducts(), profile: () => this.goToProfile(), users: () => this.goToUsers(), assistant: () => this.goToLlm(), traffic: () => this.goToTrafficMonitor(), qr: () => this.goToQrCode(), email: () => this.goToEmail() };
    await act(agent, 'Open {destination} from the home page.', flows[destination], { params: { destination } });
  }
  async expectWelcomeMeaning(agent: Agent) {
    await assertMeaning(agent, 'The home screen welcomes the authenticated user and offers product shopping, profile, users directory and utility tools.');
    await assertMeaning(agent, 'The navigation offers Logout and the signed-in profile instead of asking the current user to log in.');
  }

}
