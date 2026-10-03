import { challengeMeaning } from '../support/challenges';
import { unique, type Agent } from 'e2e';
import { act, assertMeaning } from '../support/ai-evaluation';
import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import { GetCartClient } from '../clients/cart/get-cart-client';
import type { CartItemDto } from '../types/commerce';
import type { ProductDto } from '../types/product';
import { BasePage } from './base-page';
import { AuthenticatedHeader } from './components/authenticated-header';

export class CartPage extends BasePage {
  readonly header: AuthenticatedHeader;

  constructor(page: Page) {
    super(page, '/cart', 'cart-page');
    this.header = new AuthenticatedHeader(page);
  }

  async expectCombinedCartWithAgent(agent: Agent) {
    await challengeMeaning(this.page, agent, 'cart', 'The cart has two distinct product lines, one with quantity 3 and the other with quantity 1. The summary combines them as 4 units costing $42.50.');
  }
  async expectEmptyWithAgent(agent: Agent) {
    await challengeMeaning(this.page, agent, 'empty', 'The cart communicates that it contains no items, and the navigation does not indicate any remaining cart items.');
  }
  async expectVisible() {
    await expect(this.root).toBeVisible();
  }
  async reload() { await this.page.browser.reload(); }
  async increaseQuantity(id: number) { await this.root.getByTestId(`cart-item-increase-${id}`).tap(); }
  async updateQuantity(id: number) { await this.root.getByTestId(`cart-item-update-${id}`).tap(); }
  async removeItem(id: number) { await this.root.getByTestId(`cart-item-remove-${id}`).tap(); }
  async clear(confirm: boolean) {
    await this.page.browser.onDialog(confirm ? 'accept' : 'dismiss');
    await this.root.getByTestId('cart-clear-button').tap();
  }
  async checkout() { await this.root.getByTestId('cart-checkout-button').tap(); }
  async expectItem(product: ProductDto, quantity: number) {
    await expect(this.root.getByTestId(`cart-item-name-${product.id}`)).toHaveText(product.name);
    await expect(this.root.getByTestId(`cart-item-quantity-${product.id}`)).toHaveText(String(quantity));
    await expect(this.root.getByTestId(`cart-item-total-${product.id}`)).toHaveText(`$${(product.price * quantity).toFixed(2)}`);
  }
  async expectSummary(quantity: number, total: number) {
    await expect(this.root.getByTestId('cart-summary-items-count')).toHaveText(String(quantity));
    await expect(this.root.getByTestId('cart-summary-total-price')).toHaveText(`$${total.toFixed(2)}`);
  }
  async expectEmpty() { await expect(this.root.getByTestId('cart-empty')).toBeVisible(); }

  async expectPersistedItems(token: string, items: CartItemDto[]) {
    const client = new GetCartClient(this.page.request);
    await expect.poll(async () => {
      const response = await client.get(token);
      expect(response.status()).toBe(200);
      const body = await response.json();
      return body.items.map(({ productId, quantity }: CartItemDto) => ({ productId, quantity }))
        .sort((a: CartItemDto, b: CartItemDto) => a.productId - b.productId);
    }).toEqual([...items].sort((a, b) => a.productId - b.productId));
  }

  async updateWithAgent(product: ProductDto, agent: Agent) {
    await act(agent, 'In the cart, increase the quantity of {name} from 2 to 3 and save its quantity update once. Keep the other product unchanged.', async () => { await this.increaseQuantity(product.id); await this.updateQuantity(product.id); }, { params: { name: unique(product.name) } });
  }
  async removeWithAgent(product: ProductDto, agent: Agent) { await act(agent, 'Remove only {name} from the cart.', () => this.removeItem(product.id), { params: { name: unique(product.name) } }); }
  async clearWithAgent(agent: Agent) {
    await this.page.browser.onDialog('accept');
    await act(agent, 'Clear the entire cart using Clear Cart and confirm once.', () => this.clear(true));
  }
  async checkoutWithAgent(agent: Agent) { await act(agent, 'Continue from the cart to checkout using Proceed to Checkout.', () => this.checkout()); }
  async expectSummaryMeaning(agent: Agent, quantity: number, total: number) {
    await assertMeaning(agent, `The cart summary contains ${quantity} units and a total of $${total.toFixed(2)}, consistent with the displayed product lines.`);
  }
  async expectRemovalMeaning(agent: Agent) { await assertMeaning(agent, 'The cart now has exactly one product line with one unit, costing $5.00, and the navigation agrees with that remaining quantity.'); }

}
