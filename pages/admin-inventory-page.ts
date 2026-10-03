import { z } from 'zod';
import { waitForMeaning } from '../support/wait-evaluation';
import { randomUUID } from 'node:crypto';
import { AdjustInventoryClient } from '../clients/inventory/adjust-inventory-client';
import { challengeMeaning, challengeHiddenStock } from '../support/challenges';
import { unique } from 'e2e';
import { act, assertMeaning } from '../support/ai-evaluation';
import type { Agent } from 'e2e';
import type { PageContext as Page } from '../support/fixtures';

import { expect } from 'e2e';
import { APP_BASE_URL } from '../test-config';
import { BasePage } from './base-page';
import { GetInventoryClient } from '../clients/inventory/get-inventory-client';
import { ListInventoryMovementsClient } from '../clients/inventory/list-inventory-movements-client';

export class AdminInventoryPage extends BasePage {
  constructor(page: Page) { super(page, '/admin/inventory', 'admin-inventory'); }
  async openProduct(id: number) { await this.page.browser.goto(`${APP_BASE_URL}/admin/inventory/${id}`); }
  async selectWithAgent(id: number, name: string, agent: Agent) {
    await act(agent, 'Search inventory for {name}, then select that exact product to inspect its stock. Do not change stock yet.', async () => { await this.search(name); await this.selectProduct(id); }, { params: { name: unique(name) } });
  }
  async search(name: string) { await this.root.getByLabel('Search', { exact: true }).fill(name); }
  async selectProduct(id: number) { await this.root.getByTestId(`inventory-row-${id}`).tap(); }
  async fillAdjustment(delta: number, reason: string) {
    await this.root.getByLabel('Quantity change').fill(String(delta));
    await this.root.getByLabel('Reason', { exact: true }).fill(reason);
  }
  async adjustWithAgent(agent: Agent) {
    await act(agent, 'For the currently selected product, add 3 units of inventory with the reason Received three replacement units. Apply this adjustment exactly once.', async () => { await this.fillAdjustment(3, 'Received three replacement units'); await this.applyAdjustment(); });
  }
  async applyAdjustment() { await this.root.getByRole('button', { name: 'Apply adjustment' }).tap(); }
  async expectSelected(name: string, quantity: number) {
    const inspector = this.root.getByTestId('inventory-inspector');
    await expect(inspector.getByRole('heading', { name, exact: true })).toBeVisible();
    await expect(inspector.getByText(String(quantity), { exact: true })).toBeVisible();
  }
  async expectMovement(reason: string, delta: number) {
    const inspector = this.root.getByTestId('inventory-inspector');
    await expect(inspector.getByText(reason, { exact: false })).toBeVisible();
    await expect(inspector.getByText(delta > 0 ? `+${delta}` : String(delta), { exact: true })).toBeVisible();
  }
  async waitForAdjustmentWithAgent(agent: Agent) {
    await waitForMeaning(this.page, agent, 'The selected product currently displays 13 available units and a movement adding 3 units with the reason Received three replacement units.', { selector: '[data-testid="inventory-inspector"]' });
  }
  async expectExtractedAdjustment(agent: Agent) {
    if (process.env.E2E_ASSERTIONS === 'off') return;
    const movement = await agent.extract('Read the selected product’s current available quantity and the delta and reason of the movement named Received three replacement units. Return the numeric delta with its sign.', {
      schema: z.object({ availableQuantity: z.number().int(), delta: z.number().int(), reason: z.string() }),
    });
    expect(movement).toEqual({ availableQuantity: 13, delta: 3, reason: 'Received three replacement units' });
  }
  async expectAdjustmentWithAgent(agent: Agent) {
    await challengeMeaning(this.page, agent, 'inventory', 'The selected product has 13 units available. Its movement history records an addition of 3 units with the reason Received three replacement units, consistent with increasing the stock from 10 to 13.');
  }
  async expectPersisted(id: number, token: string, quantity: number, reason: string, delta: number) {
    const response = await new GetInventoryClient(this.page.request).get(id, token);
    expect(response.status()).toBe(200);
    expect((await response.json()).availableQuantity).toBe(quantity);
    const movements = await new ListInventoryMovementsClient(this.page.request).list(id, token);
    expect(movements.status()).toBe(200);
    expect((await movements.json()).content.filter((m: { reason: string }) => m.reason === reason)).toEqual([
      expect.objectContaining({ reason, delta }),
    ]);
  }
  async expectClientDenied() {
    await expect(this.page.browser).toHaveURL(`${APP_BASE_URL}/`);
    await expect(this.root).toHaveCount(0);
  }

  async challengeHiddenPersistence(id: number, token: string, agent: Agent) {
    await challengeHiddenStock(agent, 'The selected product has 13 units available. Its movement history records an addition of 3 units with the reason Received three replacement units, consistent with increasing the stock from 10 to 13.', async delta => {
      const response = await new AdjustInventoryClient(this.page.request).adjust(id, { delta, reason: 'Isolated hidden-persistence challenge', requestId: randomUUID() }, token);
      expect(response.ok()).toBe(true);
    }, async () => (await (await new GetInventoryClient(this.page.request).get(id, token)).json()).availableQuantity);
  }

}
