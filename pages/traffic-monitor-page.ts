import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import { BasePage } from './base-page';
import { AuthenticatedHeader } from './components/authenticated-header';

export class TrafficMonitorPage extends BasePage {
  readonly header: AuthenticatedHeader;

  constructor(page: Page) {
    super(page, '/traffic', 'traffic-monitor-page');
    this.header = new AuthenticatedHeader(page);
  }

  async expectVisible() {
    await expect(this.root).toBeVisible();
  }
}
