import type { PageContext as Page } from '../../support/fixtures';

import { expect, type Locator } from 'e2e';

export class ProductCard {
  constructor(private readonly root: Locator) {}

  async openDetails() {
    await this.root.getByTestId('product-name').tap();
  }

  async increaseQuantity() {
    await this.root.getByTestId('product-increase-quantity').tap();
  }

  async saveToCart() {
    await this.root.getByTestId('product-add-button').tap();
  }

  async removeFromCart() {
    await this.root.getByTestId('product-remove-button').tap();
  }

  async expectInCart(quantity: number) {
    await expect(this.root.getByText(`${quantity} in cart`, { exact: true })).toBeVisible();
    await expect(this.root.getByTestId('product-quantity-value')).toHaveText(String(quantity));
    await expect(this.root.getByTestId('product-add-button')).toHaveText('Update Cart');
  }

  async expectNotInCart() {
    await expect(this.root.getByTestId('product-add-button')).toHaveText('Add to Cart');
    await expect(this.root.getByTestId('product-remove-button')).toHaveCount(0);
  }
}
