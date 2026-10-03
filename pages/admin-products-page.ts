import { unique, type Agent } from 'e2e';
import { act, assertMeaning } from '../support/ai-evaluation';
import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import { APP_BASE_URL } from '../test-config';
import { BasePage } from './base-page';
import { GetProductByIdClient } from '../clients/products/get-product-by-id-client';
import type { ProductDto } from '../types/product';

export class AdminProductsPage extends BasePage {
  constructor(page: Page) { super(page, '/admin/products', 'admin-products-page'); }
  async expectProduct(product: ProductDto) {
    await expect(this.root.getByTestId(`admin-product-name-${product.id}`)).toHaveText(product.name);
    await expect(this.root.getByTestId(`admin-product-price-${product.id}`)).toHaveText(`$${product.price.toFixed(2)}`);
    await expect(this.root.getByTestId(`admin-product-stock-${product.id}`)).toHaveText(String(product.stockQuantity));
    await expect(this.root.getByTestId(`admin-product-category-${product.id}`)).toHaveText(product.category);
  }
  async expectEditedProductWithAgent(product: ProductDto, agent: Agent) {
    await assertMeaning(agent, `The catalog row for ${product.name} shows the updated price $24.75 and stock 6 together, associating these values with this edited product.`);
  }
  async edit(id: number) { await this.root.getByTestId(`admin-product-edit-${id}`).tap(); }
  async remove(id: number, confirm: boolean) {
    await this.page.browser.onDialog(confirm ? 'accept' : 'dismiss');
    await this.root.getByTestId(`admin-product-delete-${id}`).tap();
  }
  async expectRemoved(id: number, token: string) {
    await expect(this.root.getByTestId(`admin-product-row-${id}`)).toHaveCount(0);
    expect((await new GetProductByIdClient(this.page.request).get(id, token)).status()).toBe(404);
  }
  async expectClientDenied() {
    await expect(this.page.browser).toHaveURL(`${APP_BASE_URL}/`);
    await expect(this.root).toHaveCount(0);
  }

  async removeWithAgent(product: ProductDto, agent: Agent) {
    await this.page.browser.onDialog('accept');
    await act(agent, 'Delete only the disposable product {name} from the admin catalog and confirm once. Never delete any other product.', () => this.remove(product.id, true), { params: { name: unique(product.name) } });
  }
  async expectProductMeaning(product: ProductDto, agent: Agent) { await assertMeaning(agent, `The admin catalog associates ${product.name} with price $${product.price.toFixed(2)}, stock ${product.stockQuantity} and category ${product.category}, and offers edit/delete actions for that row.`); }
  async expectDeniedMeaning(agent: Agent) { await assertMeaning(agent, 'The client has been returned to the authenticated home page without any product administration table.'); }

}
