import { challengeMeaning } from '../support/challenges';
import { act, assertMeaning } from '../support/ai-evaluation';
import type { Agent } from 'e2e';
import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import { BasePage } from './base-page';
import { GetOrdersClient } from '../clients/orders/get-orders-client';
import type { AddressDto } from '../types/commerce';
import type { ProductDto } from '../types/product';

export class CheckoutPage extends BasePage {
  constructor(page: Page) { super(page, '/checkout', 'checkout-page'); }
  async fillAddress(address: AddressDto) {
    for (const [field, value] of Object.entries(address)) {
      await this.root.getByTestId(`checkout-${field === 'zipCode' ? 'zip' : field}-input`).fill(value);
    }
  }
  async fillAddressWithAgent(address: AddressDto, agent: Agent) {
    await act(agent, 'Fill the checkout shipping address using street {street}, city {city}, state {state}, ZIP code {zipCode}, and country {country}. Leave the order unsubmitted.', () => this.fillAddress(address), { params: { ...address } });
    await this.expectAddress(address);
  }
  async submit() { await this.root.getByTestId('checkout-submit-button').tap(); }
  async placeOrder(): Promise<number> {
    const response = this.page.browser.waitForResponse('**/api/v1/orders');
    await this.submit();
    return (await (await response).json() as { id: number }).id;
  }
  async expectSummary(product: ProductDto, quantity: number) {
    await expect(this.root.getByTestId(`checkout-item-name-${product.id}`)).toHaveText(product.name);
    await expect(this.root.getByTestId(`checkout-item-quantity-${product.id}`)).toHaveText(String(quantity));
    await expect(this.root.getByTestId('checkout-total-amount')).toHaveText(`$${(product.price * quantity).toFixed(2)}`);
  }
  async expectMissingAddressWithAgent(agent: Agent) {
    await challengeMeaning(this.page, agent, 'missing', 'Checkout keeps the user on the form and marks every one of Street Address, City, State/Province, ZIP Code and Country as required. None is described as optional. The summary has 2 units, and all displayed overall order totals, including the form Order Total and the Order Summary Total, are exactly $25.00 and agree with the item total.');
  }
  async expectUnavailableStockWithAgent(agent: Agent) {
    await challengeMeaning(this.page, agent, 'unavailable', 'Checkout explains that requested quantities are unavailable and that the cart was preserved for review. The shipping form still contains 123 Main St, Warsaw, Mazovia, 00-001, Poland.');
  }
  async expectRequiredAddress() {
    for (const [field, message] of Object.entries({ street: 'Street address is required', city: 'City is required', state: 'State is required', zip: 'ZIP code is required', country: 'Country is required' })) {
      await expect(this.root.getByTestId(`checkout-${field}-error`)).toHaveText(message);
    }
  }
  async expectNoOrders(token: string) {
    const response = await new GetOrdersClient(this.page.request).get(token);
    expect(response.status()).toBe(200);
    expect((await response.json()).totalElements).toBe(0);
  }
  async expectAvailabilityError(message: string) {
    await expect(this.root.getByTestId('checkout-availability-error')).toHaveText(message);
  }
  async expectAddress(address: AddressDto) {
    for (const [field, value] of Object.entries(address)) {
      await expect(this.root.getByTestId(`checkout-${field === 'zipCode' ? 'zip' : field}-input`)).toHaveValue(value);
    }
  }

  async submitWithAgent(agent: Agent) { await act(agent, 'Submit the current checkout once. Stop at any validation or stock feedback and keep all supplied field values unchanged.', () => this.submit()); }
  async placeWithAgent(agent: Agent): Promise<number> {
    const response = this.page.browser.waitForResponse('**/api/v1/orders');
    await act(agent, 'Place this order once using Place Order and stop at its confirmation page.', () => this.submit());
    return (await (await response).json() as { id: number }).id;
  }
  async expectReadyMeaning(agent: Agent) { await assertMeaning(agent, 'Checkout contains an order summary with two units costing $25.00 and asks for a complete shipping address before placing the order.'); }
  async expectAddressMeaning(agent: Agent) { await assertMeaning(agent, 'The shipping form contains 123 Main St, Warsaw, Mazovia, 00-001 and Poland, while the order summary still totals $25.00 for two units.'); }

}
