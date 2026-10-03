import { challengeMeaning } from '../support/challenges';
import { act, assertMeaning } from '../support/ai-evaluation';
import type { Agent } from 'e2e';
import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import { GetProductByIdClient } from '../clients/products/get-product-by-id-client';
import { APP_BASE_URL } from '../test-config';
import { AuthenticatedHeader } from './components/authenticated-header';
import { Toast } from './components/toast';
import type { ProductDto } from '../types/product';

export class ProductDetailsPage {
  readonly header: AuthenticatedHeader;
  readonly toast: Toast;
  constructor(private readonly page: Page) {
    this.header = new AuthenticatedHeader(page);
    this.toast = new Toast(page);
  }

  async open(id: number) { await this.page.browser.goto(`${APP_BASE_URL}/products/${id}`); }
  async reload() { await this.page.browser.reload(); }
  async increaseQuantity() { await this.page.screen.getByTestId('increase-quantity').tap(); }
  async saveToCart() { await this.page.screen.getByTestId('add-to-cart').tap(); }
  async removeFromCart() { await this.page.screen.getByTestId('remove-from-cart').tap(); }
  async expectInCart(quantity: number) {
    await expect(this.page.screen.getByTestId('product-cart-quantity')).toHaveText(`${quantity} in cart`);
    await expect(this.page.screen.getByTestId('quantity-value')).toHaveText(String(quantity));
    await expect(this.page.screen.getByTestId('add-to-cart')).toHaveText('Update Cart');
  }
  async expectNotInCart() {
    await expect(this.page.screen.getByTestId('product-cart-quantity')).toHaveCount(0);
    await expect(this.page.screen.getByTestId('add-to-cart')).toHaveText('Add to Cart');
  }
  async expectOutOfStock() {
    await expect(this.page.screen.getByTestId('product-stock')).toHaveText('Out of stock');
    await expect(this.page.screen.getByTestId('add-to-cart')).toBeDisabled();
  }
  async expectStockConstraintWithAgent(agent: Agent) {
    await challengeMeaning(this.page, agent, 'stock', 'The product is presented as out of stock and its Add to Cart control is disabled, so this item cannot currently be purchased from the detail page.');
  }
  async expectUnavailable() { await expect(this.page.screen.getByTestId('product-not-found')).toHaveText(/Error loading product details/); }
  async backToProducts() { await this.page.screen.getByTestId('product-not-found').getByRole('link', { name: 'Back to Products' }).tap(); }


  async expectUrl(id: number) {
    await expect(this.page.browser).toHaveURL(`${APP_BASE_URL}/products/${id}`);
  }

  async expectProduct(product: ProductDto) {
    const root = this.page.screen.getByTestId('product-details-page');
    await expect(root.getByTestId('product-title')).toHaveText(product.name);
    await expect(root.getByTestId('product-price')).toHaveText(`$${product.price.toFixed(2)}`);
    await expect(root.getByTestId('product-description')).toHaveText(product.description);
  }
  async expectPersistedStock(id: number, token: string, quantity: number) {
    const response = await new GetProductByIdClient(this.page.request).get(id, token);
    expect(response.status()).toBe(200);
    expect((await response.json()).stockQuantity).toBe(quantity);
  }

  async saveQuantityWithAgent(agent: Agent, quantity: number) {
    await act(agent, 'Increase the selected quantity by one to {quantity} and save it to the cart once using Add to Cart or Update Cart.', async () => { await this.increaseQuantity(); await this.saveToCart(); }, { params: { quantity } });
  }
  async removeWithAgent(agent: Agent) { await act(agent, 'Remove this product from the cart using Remove from Cart.', () => this.removeFromCart()); }
  async recoverWithAgent(agent: Agent) { await act(agent, 'Return to the product catalog using Back to Products on the unavailable-product message.', () => this.backToProducts()); }
  async expectCartMeaning(agent: Agent, quantity: number) { await assertMeaning(agent, `This product has ${quantity} units in the cart; the selected quantity and the navigation cart count agree, and the purchase button now offers Update Cart.`); }
  async expectRemovedMeaning(agent: Agent) { await assertMeaning(agent, 'This product is no longer in the cart. The purchase action has returned to Add to Cart and navigation has no remaining item count.'); }
  async expectUnavailableMeaning(agent: Agent) { await assertMeaning(agent, 'The requested product cannot be loaded, and a Back to Products link offers recovery to the catalog.'); }
  async expectProductMeaning(agent: Agent, product: ProductDto) { await assertMeaning(agent, `The product detail page identifies ${product.name}, describes it, and displays its price $${product.price.toFixed(2)}.`); }

}
