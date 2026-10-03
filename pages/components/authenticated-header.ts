import { act, assertMeaning } from '../../support/ai-evaluation';
import type { Agent } from 'e2e';
import type { PageContext as Page } from '../../support/fixtures';

import { expect, type Locator } from 'e2e';

export class AuthenticatedHeader {
  private readonly root: Locator;

  constructor(page: Page) {
    this.root = page.screen.getByTestId('navigation');
  }

  async expectVisible() {
    const profile = this.root.getByTestId('username-profile-link');
    await expect(profile).toBeVisible();
    await expect(profile).toHaveAttribute('href', '/profile');
    await expect(profile).not.toHaveText('');
    await expect(this.root.getByTestId('logout-button')).toBeVisible();
    await expect(this.root.getByTestId('login-link')).toBeHidden();
  }

  async expectUser(firstName: string, lastName: string) {
    await expect(this.root.getByTestId('username-profile-link')).toHaveText(`${firstName} ${lastName}`);
  }

  async expectCartCount(quantity: number) {
    const cart = this.root.getByTestId('desktop-cart-icon');
    await expect(cart).toBeVisible();
    const count = cart.getByTestId('cart-item-count');
    if (quantity === 0) {
      await expect(count).toHaveCount(0);
    } else {
      await expect(count).toHaveText(String(quantity));
    }
  }

  async goToProducts(agent?: Agent): Promise<void> {
    if (agent) { await act(agent, 'Open Products from the navigation.', () => this.goToProducts()); return; }
    await this.root.getByTestId('desktop-menu-products').tap();
  }

  async goToSendEmail(agent?: Agent): Promise<void> {
    if (agent) { await act(agent, 'Open Send Email from the navigation.', () => this.goToSendEmail()); return; }
    await this.root.getByTestId('desktop-menu-send-email').tap();
  }

  async goToQrCode(agent?: Agent): Promise<void> {
    if (agent) { await act(agent, 'Open QR Code from the navigation.', () => this.goToQrCode()); return; }
    await this.root.getByTestId('desktop-menu-qr-code').tap();
  }

  async goToLlm(agent?: Agent): Promise<void> {
    if (agent) { await act(agent, 'Open LLM from the navigation.', () => this.goToLlm()); return; }
    await this.root.getByTestId('desktop-menu-llm').tap();
  }

  async goToTrafficMonitor(agent?: Agent): Promise<void> {
    if (agent) { await act(agent, 'Open Traffic Monitor from the navigation.', () => this.goToTrafficMonitor()); return; }
    await this.root.getByTestId('desktop-menu-traffic-monitor').tap();
  }

  async goToAdmin(agent?: Agent): Promise<void> {
    if (agent) { await act(agent, 'Open Admin from the navigation.', () => this.goToAdmin()); return; }
    await this.root.getByTestId('desktop-menu-admin').tap();
  }

  async expectAdminLinkVisible() {
    await expect(this.root.getByTestId('desktop-menu-admin')).toBeVisible();
    await expect(this.root.getByTestId('desktop-menu-admin')).toHaveAttribute('href', '/admin');
  }

  async expectAdminLinkAbsent() {
    // The populated profile and role links render from the same loaded user data.
    await this.expectVisible();
    await expect(this.root.getByTestId('desktop-menu-admin')).toHaveCount(0);
  }

  async goToProfile(agent?: Agent): Promise<void> {
    if (agent) { await act(agent, 'Open the signed-in user profile from the navigation.', () => this.goToProfile()); return; }
    await this.root.getByTestId('username-profile-link').tap();
  }

  async goToCart(agent?: Agent): Promise<void> {
    if (agent) { await act(agent, 'Open the shopping cart from the navigation.', () => this.goToCart()); return; }
    await this.root.getByTestId('desktop-cart-icon').tap();
  }

  async goHome(agent?: Agent): Promise<void> {
    if (agent) { await act(agent, 'Return home using the Awesome Testing brand link.', () => this.goHome()); return; }
    await this.root.getByTestId('brand-link').tap();
  }

  async logout(agent?: Agent): Promise<void> {
    if (agent) { await act(agent, 'Log out once using Logout and stop at the login page.', () => this.logout()); return; }
    await this.root.getByTestId('logout-button').tap();
  }
  async expectMeaning(agent: Agent, statement: string) { await assertMeaning(agent, statement); }

}
