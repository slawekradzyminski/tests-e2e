import { waitForMeaning } from '../support/wait-evaluation';
import { challengeMeaning } from '../support/challenges';
import { act, assertMeaning } from '../support/ai-evaluation';
import type { Agent } from 'e2e';
import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import { APP_BASE_URL } from '../test-config';
import { AuthenticatedHeader } from './components/authenticated-header';
import { GetOrderClient } from '../clients/orders/get-order-client';
import type { AddressDto, OrderStatus } from '../types/commerce';
import type { ProductDto } from '../types/product';

export class OrderDetailsPage {
  readonly header: AuthenticatedHeader;
  constructor(private readonly page: Page) { this.header = new AuthenticatedHeader(page); }
  async open(id: number) { await this.page.browser.goto(`${APP_BASE_URL}/orders/${id}`); }
  async reload() { await this.page.browser.reload(); }
  async expectUrl(id: number) { await expect(this.page.browser).toHaveURL(`${APP_BASE_URL}/orders/${id}`); }
  async cancel(confirm: boolean) {
    await this.page.browser.onDialog(confirm ? 'accept' : 'dismiss');
    await this.page.screen.getByTestId('order-details-cancel-button').tap();
  }
  async markPaidWithAgent(agent: Agent) {
    await act(agent, 'Set the current order status to PAID and save the status update exactly once.', () => this.changeStatus('PAID'));
  }
  async cancelWithAgent(agent: Agent) {
    await this.page.browser.onDialog('accept');
    await act(agent, 'Cancel the current order using Cancel Order and confirm the cancellation.', () => this.cancel(true));
  }
  async expectPaidWithAgent(agent: Agent) {
    await challengeMeaning(this.page, agent, 'paid', 'The current order status badge is PAID. It contains two units. The overall order Total is exactly $25.00 and agrees with the item line total; a matching item subtotal does not excuse a different overall Total. Its shipping address is in Warsaw, Poland.');
  }
  async expectCancelledWithAgent(agent: Agent) {
    await challengeMeaning(this.page, agent, 'cancelled', 'The current order is CANCELLED, its original two-unit item and $25.00 total remain visible, and there is no action available to cancel it again.');
  }
  async changeStatus(status: OrderStatus) {
    await this.page.screen.getByTestId('order-details-status-select').selectOption({ value: status });
    await this.page.screen.getByTestId('order-details-update-status-button').tap();
  }
  async waitForConfirmationWithAgent(agent: Agent) {
    if (process.env.E2E_WAIT_CHALLENGE) await expect(this.page.screen.getByTestId('order-details')).toBeVisible();
    await waitForMeaning(this.page, agent, 'The order details are visible with PENDING status, ordered items and shipping information.', { selector: '[data-testid="order-details"]' });
  }
  async expectConfirmationWithAgent(agent: Agent) {
    await assertMeaning(agent, 'The page confirms an order with PENDING status, an ordered item with quantity 2, total $25.00, and a shipping address in Warsaw, Poland.');
  }
  async expectStatus(status: OrderStatus) { await expect(this.page.screen.getByTestId('order-details-status')).toHaveText(status); }
  async expectCancellationUnavailable() { await expect(this.page.screen.getByTestId('order-details-cancel-button')).toHaveCount(0); }
  async expectClientControls() {
    await expect(this.page.screen.getByTestId('order-details')).toBeVisible();
    await expect(this.page.screen.getByTestId('order-details-admin-controls')).toHaveCount(0);
  }
  async expectOrder(id: number, product: ProductDto, quantity: number, address: AddressDto) {
    await expect(this.page.screen.getByTestId('order-details-title')).toHaveText(`Order #${id}`);
    const item = this.page.screen.getByTestId('order-details-items-list');
    await expect(item.getByTestId(/^order-item-name-/)).toHaveText(product.name);
    await expect(item.getByTestId(/^order-item-price-details-/)).toHaveText(`$${product.price} x ${quantity}`);
    await expect(this.page.screen.getByTestId('order-details-total-amount')).toHaveText(`$${(product.price * quantity).toFixed(2)}`);
    await expect(this.page.screen.getByTestId('order-details-address-street')).toHaveText(address.street);
    await expect(this.page.screen.getByTestId('order-details-address-city-state')).toHaveText(`${address.city}, ${address.state} ${address.zipCode}`);
    await expect(this.page.screen.getByTestId('order-details-address-country')).toHaveText(address.country);
  }
  async expectPersisted(id: number, token: string, expected: { status: OrderStatus; username?: string; totalAmount?: number; shippingAddress?: AddressDto }) {
    await expect.poll(async () => {
      const response = await new GetOrderClient(this.page.request).get(id, token);
      expect(response.status()).toBe(200);
      return await response.json();
    }).toMatchObject(expected);
  }
}
