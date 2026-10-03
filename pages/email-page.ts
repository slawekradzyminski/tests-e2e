import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import { BasePage } from './base-page';
import { AuthenticatedHeader } from './components/authenticated-header';

export class EmailPage extends BasePage {
  readonly header: AuthenticatedHeader;

  constructor(page: Page) {
    super(page, '/email', 'email-page');
    this.header = new AuthenticatedHeader(page);
  }

  async expectVisible() {
    await expect(this.root).toBeVisible();
  }
}
