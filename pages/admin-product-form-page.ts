import { act, assertMeaning } from '../support/ai-evaluation';
import { unique, type Agent } from 'e2e';
import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import { APP_BASE_URL } from '../test-config';
import { GetProductByIdClient } from '../clients/products/get-product-by-id-client';
import type { ProductCreateDto, ProductDto } from '../types/product';

type ProductFields = Omit<ProductCreateDto, 'imageUrl'> & { imageUrl?: string | null };

export class AdminProductFormPage {
  constructor(private readonly page: Page) {}
  async openNew() { await this.page.browser.goto(`${APP_BASE_URL}/admin/products/new`); }
  async openEdit(id: number) { await this.page.browser.goto(`${APP_BASE_URL}/admin/products/edit/${id}`); }
  async reload() { await this.page.browser.reload(); }
  async fill(product: ProductFields) {
    for (const [field, value] of Object.entries({ name: product.name, description: product.description ?? '', price: product.price, stock: product.stockQuantity, category: product.category, image: product.imageUrl ?? '' })) {
      await this.page.screen.getByTestId(`product-${field}-input`).fill(String(value));
    }
  }
  async editWithAgent(product: ProductFields & { id: number }, agent: Agent) {
    const response = this.page.browser.waitForResponse(`**/api/v1/products/${product.id}`);
    await act(agent, 'Update the current product: name {name}, description {description}, price {price}, stock quantity {stock}. Keep its category and image unchanged. Click Update Product exactly once, then finish this step immediately. This app intentionally stays on the edit form after saving. Stay on this page; the test verifies persistence separately.', async () => { await this.fill(product); await this.page.screen.getByTestId('product-submit-button').tap(); }, {
      params: { name: unique(product.name), description: product.description ?? '', price: product.price, stock: product.stockQuantity },
    });
    await response;
  }
  async create(): Promise<ProductDto> {
    const response = this.page.browser.waitForResponse('**/api/v1/products');
    await this.page.screen.getByTestId('product-submit-button').tap();
    return (await response).json();
  }
  async save(id: number) {
    const response = this.page.browser.waitForResponse(`**/api/v1/products/${id}`);
    await this.page.screen.getByTestId('product-submit-button').tap();
    await response;
  }
  async expectValues(product: ProductFields) {
    for (const [field, value] of Object.entries({ name: product.name, description: product.description ?? '', price: product.price, stock: product.stockQuantity, category: product.category })) {
      await expect(this.page.screen.getByTestId(`product-${field}-input`)).toHaveValue(String(value));
    }
  }
  async expectReset() { await expect(this.page.screen.getByTestId('product-name-input')).toHaveValue(''); }
  async expectPersisted(id: number, token: string, product: ProductFields) {
    const response = await new GetProductByIdClient(this.page.request).get(id, token);
    expect(response.status()).toBe(200);
    const { name, description, price, stockQuantity, category } = product;
    expect(await response.json()).toMatchObject({ name, description, price, stockQuantity, category });
  }
  async expectClientDenied() {
    await expect(this.page.browser).toHaveURL(`${APP_BASE_URL}/`);
    await expect(this.page.screen.getByTestId('product-form')).toHaveCount(0);
  }

  async createWithAgent(agent: Agent): Promise<ProductDto> {
    const response = this.page.browser.waitForResponse('**/api/v1/products');
    await act(agent, 'Create this product once using Create Product. The form clears after success; finish immediately after submitting and stay on this form.', () => this.page.screen.getByTestId('product-submit-button').tap());
    return (await response).json();
  }
  async expectDeniedMeaning(agent: Agent) { await assertMeaning(agent, 'The client is returned to authenticated home and cannot see a product creation or editing form.'); }

}
