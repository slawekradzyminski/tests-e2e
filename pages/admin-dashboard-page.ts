import { unique, type Agent } from 'e2e';
import { act, assertMeaning } from '../support/ai-evaluation';
import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import { APP_BASE_URL } from '../test-config';
import type { ProductDto } from '../types/product';
import { BasePage } from './base-page';
import { AuthenticatedHeader } from './components/authenticated-header';

export class AdminDashboardPage extends BasePage {
  readonly header: AuthenticatedHeader;

  constructor(page: Page) {
    super(page, '/admin', 'admin-dashboard-page');
    this.header = new AuthenticatedHeader(page);
  }

  async expectVisible() {
    await expect(this.root).toBeVisible();
  }
  async expectLowStockProduct(product: ProductDto) {
    await expect(this.root.getByTestId(`admin-dashboard-product-name-${product.id}`)).toHaveText(product.name);
    await expect(this.root.getByTestId(`admin-dashboard-product-stock-${product.id}`)).toHaveText(`${product.stockQuantity} in stock`);
  }
  async editLowStockProduct(id: number) { await this.root.getByTestId(`admin-dashboard-product-update-${id}`).tap(); }
  async expectClientDenied() {
    await expect(this.page.browser).toHaveURL(`${APP_BASE_URL}/`);
    await expect(this.root).toHaveCount(0);
  }

  async editWithAgent(product: ProductDto, agent: Agent) { await act(agent, 'From the low-stock list, open the editor for {name}, which has 2 units in stock.', () => this.editLowStockProduct(product.id), { params: { name: unique(product.name) } }); }
  async expectLowStockMeaning(product: ProductDto, agent: Agent) { await assertMeaning(agent, `The low-stock list identifies ${product.name} as needing attention with 2 units remaining and offers an Update action for that product.`); }

}
