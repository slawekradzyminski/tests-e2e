import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import { APP_BASE_URL } from '../test-config';
import { BasePage } from './base-page';
import type { OrderDto, OrderStatus } from '../types/commerce';

export class AdminOrdersPage extends BasePage {
  constructor(page: Page) { super(page, '/admin/orders', 'admin-orders-page'); }
  async filter(status: OrderStatus) { await this.root.getByTestId('admin-order-list-status-filter').selectOption({ value: status }); }
  async viewOrder(id: number) { await this.root.getByTestId(`admin-order-details-${id}`).tap(); }
  async expectOrder(order: OrderDto) {
    await expect(this.root.getByTestId(`admin-order-customer-${order.id}`)).toHaveText(order.username);
    await expect(this.root.getByTestId(`admin-order-status-${order.id}`)).toHaveText(order.status);
    await expect(this.root.getByTestId(`admin-order-amount-${order.id}`)).toHaveText(`$${order.totalAmount.toFixed(2)}`);
  }
  async expectOrderAbsent(id: number) { await expect(this.root.getByTestId(`admin-order-row-${id}`)).toHaveCount(0); }
  async expectClientDenied() {
    await expect(this.page.browser).toHaveURL(`${APP_BASE_URL}/`);
    await expect(this.root).toHaveCount(0);
  }

}
