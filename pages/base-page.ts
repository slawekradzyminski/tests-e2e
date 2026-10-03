import { assertMeaning } from '../support/ai-evaluation';
import type { Agent } from 'e2e';
import type { PageContext as Page } from '../support/fixtures';

import { expect, type Locator } from 'e2e';
import { APP_BASE_URL } from '../test-config';

export abstract class BasePage {
  protected readonly root: Locator;

  protected constructor(
    protected readonly page: Page,
    private readonly path: string,
    testId: string,
  ) {
    this.root = page.screen.getByTestId(testId);
  }

  async expectMeaning(agent: Agent, statement: string) { await assertMeaning(agent, statement); }

  async open() {
    await this.page.browser.goto(`${APP_BASE_URL}${this.path}`);
  }

  async expectUrl() {
    await expect(this.page.browser).toHaveURL(`${APP_BASE_URL}${this.path}`);
  }

}
