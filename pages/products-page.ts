import { unique, type Agent } from 'e2e';
import { act, assertMeaning } from '../support/ai-evaluation';
import { z } from 'zod';
import type { PageContext as Page } from '../support/fixtures';

import { Toast } from './components/toast';
import { GetCartClient } from '../clients/cart/get-cart-client';
import type { CartItemDto } from '../types/commerce';
import { expect } from 'e2e';
import { ProductCard } from './components/product-card';
import { BasePage } from './base-page';
import { AuthenticatedHeader } from './components/authenticated-header';

export class ProductsPage extends BasePage {
  readonly header: AuthenticatedHeader;
  readonly toast: Toast;
  private readonly cart: GetCartClient;

  constructor(page: Page) {
    super(page, '/products', 'products-page');
    this.header = new AuthenticatedHeader(page);
    this.toast = new Toast(page);
    this.cart = new GetCartClient(page.request);
  }

  product(name: string) {
    return new ProductCard(this.root.getByTestId('product-item').filter({
      has: this.page.screen.getByTestId('product-name').filter({ hasText: name }),
    }));
  }

  async selectCategory(category: string) {
    await this.root.getByTestId('products-categories-list').getByRole('button', { name: category, exact: true }).tap();
  }

  async search(query: string) {
    await this.root.getByTestId('product-search').fill(query);
  }

  async sortBy(label: 'Price (Low to High)' | 'Price (High to Low)') {
    await this.root.getByTestId('product-sort').selectOption({ label });
  }

  async sortWithAgent(agent: Agent) {
    await act(agent, 'Set the product sort order to Price (Low to High).', () => this.sortBy('Price (Low to High)'));
  }
  async searchWithAgent(agent: Agent) {
    await act(agent, 'Search for BETA using the product search field. Keep the current category selected.', () => this.search('BETA'));
  }
  async sortDescendingWithAgent(agent: Agent) {
    await act(agent, 'Set the product sort order to Price (High to Low). Keep the current category selected.', () => this.sortBy('Price (High to Low)'));
  }
  async expectCatalogExtraction(agent: Agent, names: string[]) {
    if (process.env.E2E_ASSERTIONS === 'off') return;
    const extracted = await agent.extract('Read the visible product names in their display order, excluding categories and navigation.', {
      schema: z.object({ names: z.array(z.string()) }),
    });
    expect(extracted.names).toEqual(names);
  }
  async clearSearchWithAgent(agent: Agent) {
    await act(agent, 'Clear the product search using Clear Search. Keep the current category selected.', () => this.clearSearch());
  }
  async clearSearch() {
    await this.root.getByRole('button', { name: 'Clear Search', exact: true }).tap();
  }

  async reload() {
    await this.page.browser.reload();
  }

  async expectProducts(names: string[]) {
    await expect(this.root.getByTestId('product-name')).toHaveText(names);
  }

  async expectNoResults() {
    await expect(this.root.getByText('No products found', { exact: true })).toBeVisible();
    await expect(this.root.getByTestId('product-item')).toHaveCount(0);
  }

  async expectCartItems(token: string, items: CartItemDto[]) {
    await expect.poll(async () => {
      const response = await this.cart.get(token);
      return { status: response.status(), items: (await response.json()).items.sort((a: CartItemDto, b: CartItemDto) => a.productId - b.productId) };
    }, { message: 'Persisted cart matches the catalog action' }).toEqual({ status: 200, items: [...items].sort((a, b) => a.productId - b.productId) });
  }

  async expectVisible() {
    await expect(this.root).toBeVisible();
  }
  async detailsWithAgent(name: string, agent: Agent) { await act(agent, 'Open the detail page for {name}.', () => this.product(name).openDetails(), { params: { name: unique(name) } }); }
  async saveProductWithAgent(name: string, quantity: number, agent: Agent) {
    await act(agent, 'For the catalog product {name}, increase its selected quantity by one to {quantity} and save this quantity to the cart once. Leave every other product unchanged.', async () => { const card = this.product(name); await card.increaseQuantity(); await card.saveToCart(); }, { params: { name: unique(name), quantity } });
  }
  async removeProductWithAgent(name: string, agent: Agent) { await act(agent, 'Remove only {name} from the cart using its catalog card.', () => this.product(name).removeFromCart(), { params: { name: unique(name) } }); }
  async expectResultsMeaning(agent: Agent, names: string[]) { await assertMeaning(agent, `The visible product results consist of these products in this order: ${names.join('; ')}. No other product cards are shown.`); }
  async expectSortedMeaning(agent: Agent, direction: 'ascending' | 'descending') { await assertMeaning(agent, `The visible product cards are arranged by price in ${direction} order, and the sort selection describes that same direction.`); }
  async expectNoResultsMeaning(agent: Agent) { await assertMeaning(agent, 'No products match the current search; the page explains the empty results and provides a way to clear the search.'); }
  async expectCatalogCartMeaning(agent: Agent, name: string, quantity: number, total: number) { await assertMeaning(agent, `The catalog card for ${name} shows ${quantity} in cart and offers Update Cart. The navigation cart count is ${total}, including the other saved product.`); }

}
