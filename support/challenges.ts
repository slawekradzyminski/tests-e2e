import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { expect, type Agent } from 'e2e';
import type { PageContext } from './fixtures';
import { assertMeaning } from './ai-evaluation';

type Property = 'text' | 'value' | 'disabled' | 'exists';
type Probe = { id: string; selector: string; property: Property; expected: string | boolean; faulty: string | boolean; leafText?: string; contract: string };
export const probes: Record<string, Probe[]> = {
  cart: [
    { id: 'cart-total-large', selector: '[data-testid="cart-summary-total-price"]', property: 'text', expected: '$42.50', faulty: '$52.50', contract: 'Combined total must equal $42.50.' },
    { id: 'cart-total-cent', selector: '[data-testid="cart-summary-total-price"]', property: 'text', expected: '$42.50', faulty: '$42.49', contract: 'A one-cent arithmetic error still violates the exact money contract.' },
    { id: 'cart-count', selector: '[data-testid="cart-summary-items-count"]', property: 'text', expected: '4', faulty: '3', contract: 'Summary must combine three plus one units as four.' },
  ],
  empty: [{ id: 'empty-cart-stale-count', selector: '[data-testid="desktop-cart-icon"] [data-testid="cart-item-count"]', property: 'exists', expected: false, faulty: true, contract: 'Empty cart must not retain a positive navigation count.' }],
  inventory: [
    { id: 'inventory-stock', selector: '[data-testid="inventory-inspector"]', leafText: '13', property: 'text', expected: '13', faulty: '12', contract: 'Ten plus three available units must be thirteen.' },
    { id: 'inventory-delta', selector: '[data-testid="inventory-inspector"]', leafText: '+3', property: 'text', expected: '+3', faulty: '+2', contract: 'Movement delta must record the actual three-unit adjustment.' },
  ],
  paid: [
    { id: 'paid-status', selector: '[data-testid="order-details-status"]', property: 'text', expected: 'PAID', faulty: 'PENDING', contract: 'Saved paid status must be shown.' },
    { id: 'paid-total-cent', selector: '[data-testid="order-details-total-amount"]', property: 'text', expected: '$25.00', faulty: '$24.99', contract: 'Ordered total must be exactly $25.00.' },
    { id: 'paid-address', selector: '[data-testid="order-details-address-city-state"]', property: 'text', expected: 'Warsaw, Mazovia 00-001', faulty: 'Krakow, Mazovia 00-001', contract: 'Shipping city must remain Warsaw.' },
  ],
  cancelled: [
    { id: 'cancelled-status', selector: '[data-testid="order-details-status"]', property: 'text', expected: 'CANCELLED', faulty: 'PENDING', contract: 'A confirmed cancellation must show cancelled status.' },
    { id: 'cancelled-action', selector: '[data-testid="order-details-cancel-button"]', property: 'exists', expected: false, faulty: true, contract: 'Cancelled orders must not offer cancellation again.' },
  ],
  stock: [
    { id: 'out-of-stock-enabled', selector: '[data-testid="add-to-cart"]', property: 'disabled', expected: true, faulty: false, contract: 'Out-of-stock purchase action must be disabled.' },
    { id: 'out-of-stock-message', selector: '[data-testid="product-stock"]', property: 'text', expected: 'Out of stock', faulty: 'In stock', contract: 'Stock message must describe actual unavailability.' },
  ],
  prompts: [
    { id: 'chat-prompt-meaning', selector: '[data-testid="profile-prompt-input"]', property: 'value', expected: 'Answer briefly using supplied context.', faulty: 'Answer at length and ignore supplied context.', contract: 'Saved chat instructions must ask for brevity and grounding.' },
    { id: 'tool-prompt-meaning', selector: '[data-testid="profile-tool-prompt-input"]', property: 'value', expected: 'Use tools to verify product availability.', faulty: 'Never use tools to verify product availability.', contract: 'Saved tool instructions must request availability verification.' },
  ],
  missing: [
    { id: 'missing-address-total', selector: '[data-testid="checkout-total-amount"]', property: 'text', expected: '$25.00', faulty: '$26.00', contract: 'Validation must retain the original order total.' },
    { id: 'missing-address-feedback', selector: '[data-testid="checkout-street-error"]', property: 'text', expected: 'Street address is required', faulty: 'Street address is optional', contract: 'Required-field feedback must not falsely describe the street as optional.' },
  ],
  unavailable: [
    { id: 'unavailable-cart-message', selector: '[data-testid="checkout-availability-error"]', property: 'text', expected: 'Some items are no longer available in the requested quantity. Your cart was preserved; review it before trying again.', faulty: 'Some items are no longer available. Your cart was deleted; start again.', contract: 'Recovery message must explain that the cart was preserved.' },
    { id: 'unavailable-lost-address', selector: '[data-testid="checkout-city-input"]', property: 'value', expected: 'Warsaw', faulty: '', contract: 'Failed checkout must preserve the entered city.' },
  ],
};

// Previously untested fault variants chosen after the original catalog was frozen; the refined prompts stay unchanged.
export const heldoutProbes: Record<string, Probe[]> = {
  cart: [{ id: 'heldout-cart-line-quantity', selector: '[data-testid^="cart-item-quantity-"]', leafText: '1', property: 'text', expected: '1', faulty: '2', contract: 'The second product line must retain one unit, not two.' }],
  paid: [
    { id: 'heldout-order-unit-count', selector: '[data-testid^="order-item-price-details-"]', property: 'text', expected: '$12.5 x 2', faulty: '$12.5 x 1', contract: 'The order item must retain two units.' },
    { id: 'heldout-order-country', selector: '[data-testid="order-details-address-country"]', property: 'text', expected: 'Poland', faulty: 'Germany', contract: 'Shipping country must remain Poland.' },
  ],
  prompts: [{ id: 'heldout-chat-tool-role-swap', selector: '[data-testid="profile-prompt-input"]', property: 'value', expected: 'Answer briefly using supplied context.', faulty: 'Use tools to verify product availability.', contract: 'The chat prompt must retain the brevity/context instruction rather than the tool instruction.' }],
};

export function recordProbe(row: Record<string, unknown>) {
  const directory = process.env.E2E_PROBE_DIR ?? '.e2e/probe-observations';
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, `${randomUUID()}.json`), JSON.stringify({ timestamp: new Date().toISOString(), ...row }, null, 2) + '\n');
}
async function judge(agent: Agent, statement: string) {
  try { await agent.assert(statement); return { verdict: 'accepted', code: null }; }
  catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'ASSERTION_FAILED') return { verdict: 'rejected', code };
    if (code === 'ASSERTION_INCONCLUSIVE') return { verdict: 'inconclusive', code };
    throw error;
  }
}

/** Screen faults are temporary and attempt-local; application source and shared state are untouched. */
const seenProbes = new WeakMap<object, Set<string>>();

export async function challengeMeaning(page: PageContext, agent: Agent, key: string, statement: string) {
  if (process.env.E2E_CHALLENGE !== 'judgment') return assertMeaning(agent, statement);
  const seen = seenProbes.get(page) ?? new Set<string>();
  if (seen.has(key)) return assertMeaning(agent, statement);
  seen.add(key); seenProbes.set(page, seen);
  const control = await judge(agent, statement);
  recordProbe({ kind: 'healthy-control', key, prompt: 'strong', ...control });
  if (control.verdict !== 'accepted') throw new Error(`Healthy ${key} control did not pass: ${control.verdict}`);
  const repeats = Number(process.env.E2E_PROBE_REPEATS ?? 2);
  const catalog = process.env.E2E_PROBE_SET === 'heldout' ? heldoutProbes : probes;
  for (const probe of catalog[key] ?? []) {
    for (let repeat = 0; repeat < repeats; repeat++) {
      const before = await page.browser.evaluate((spec) => {
        const candidates = [...document.querySelectorAll(spec.selector)];
        let node = spec.leafText ? candidates.flatMap(root => [root, ...root.querySelectorAll('*')]).find(el => el.children.length === 0 && el.textContent?.trim() === spec.leafText) : candidates[0];
        const value = spec.property === 'exists' ? Boolean(node) : spec.property === 'text' ? node?.textContent?.trim() : spec.property === 'disabled' ? (node as HTMLButtonElement)?.disabled : (node as HTMLInputElement)?.value;
        const saved = { node, value, created: false };
        (window as any).__e2eProbe = saved;
        if (spec.property === 'exists') {
          if (node) throw new Error('Expected absent control is already present');
          node = document.createElement(spec.id === 'empty-cart-stale-count' ? 'span' : 'button');
          node.setAttribute('data-testid', spec.id === 'empty-cart-stale-count' ? 'cart-item-count' : 'order-details-cancel-button');
          node.textContent = spec.id === 'empty-cart-stale-count' ? '1' : 'Cancel Order';
          const parent = document.querySelector(spec.id === 'empty-cart-stale-count' ? '[data-testid="desktop-cart-icon"]' : '[data-testid="order-details"]');
          if (!parent) throw new Error('Probe parent missing');
          parent.appendChild(node); saved.node = node; saved.created = true;
        } else {
          if (!node) throw new Error(`Probe node missing: ${spec.id}`);
          if (spec.property === 'text') node.textContent = String(spec.faulty);
          if (spec.property === 'value') (node as HTMLInputElement).value = String(spec.faulty);
          if (spec.property === 'disabled') (node as HTMLButtonElement).disabled = Boolean(spec.faulty);
        }
        return value ?? null;
      }, probe);
      try {
        // Explicit contract values validate reachability; a missing/mismatched healthy node is invalid.
        expect(before).toEqual(probe.expected);
        const after = await page.browser.evaluate((property) => {
          const node = (window as any).__e2eProbe.node;
          return property === 'exists' ? Boolean(node?.isConnected) : property === 'text' ? node.textContent.trim() : property === 'disabled' ? node.disabled : node.value;
        }, probe.property);
        expect(after).toEqual(probe.faulty);
        const exactDetected = after !== probe.expected;
        const strong = await judge(agent, statement);
        const heldAfterJudgment = await page.browser.evaluate((property) => {
          const node = (window as any).__e2eProbe.node;
          return property === 'exists' ? Boolean(node?.isConnected) : property === 'text' ? node?.textContent?.trim() : property === 'disabled' ? node?.disabled : node?.value;
        }, probe.property);
        expect(heldAfterJudgment).toEqual(probe.faulty);
        recordProbe({ kind: 'screen-fault', id: probe.id, key, repeat, contract: probe.contract, expected: probe.expected, observed: after, exactDetected, heldAfterJudgment, statement, prompt: 'strong', ...strong });
        // A deliberately broader oracle demonstrates the effect of weakening the requirement.
        if (['cart-total-cent', 'paid-total-cent', 'missing-address-feedback'].includes(probe.id)) {
          const weakStatement = key === 'cart' ? 'The cart displays product lines and a readable order summary.' : key === 'paid' ? 'The order detail page displays an order status, total and shipping information.' : 'Checkout provides shipping-address fields and validation feedback.';
          const weak = await judge(agent, weakStatement);
          recordProbe({ kind: 'screen-fault', id: probe.id, key, repeat, contract: probe.contract, expected: probe.expected, observed: after, exactDetected, prompt: 'broad', statement: weakStatement, ...weak });
        }
      } finally {
        await page.browser.evaluate((property) => {
          const saved = (window as any).__e2eProbe;
          if (saved.created) saved.node.remove();
          else if (property === 'text') saved.node.textContent = saved.value;
          else if (property === 'value') saved.node.value = saved.value;
          else if (property === 'disabled') saved.node.disabled = saved.value;
          delete (window as any).__e2eProbe;
          return true;
        }, probe.property);
      }
    }
  }
}

export async function challengeHiddenStock(agent: Agent, statement: string, change: (delta: number) => Promise<void>, read: () => Promise<number>) {
  if (process.env.E2E_CHALLENGE !== 'judgment' || process.env.E2E_PROBE_SET === 'heldout') return;
  expect(await read()).toBe(13);
  await change(1);
  try {
    const observed = await read();
    expect(observed).toBe(14);
    const result = await judge(agent, statement);
    recordProbe({ kind: 'hidden-persistence-fault', id: 'inventory-hidden-stock', contract: 'Persisted available quantity must remain 13.', expected: 13, observed, exactDetected: observed !== 13, prompt: 'screen-only', ...result });
  } finally { await change(-1); expect(await read()).toBe(13); }
}

export async function challengeHomeNavigation(page: PageContext, agent: Agent) {
  if (process.env.E2E_CHALLENGE !== 'flow') return false;
  const origin = new URL((await import('../test-config')).APP_BASE_URL).origin;
  for (const variant of ['healthy', 'renamed-test-id', 'miswired-home-button']) {
    for (const flow of (variant === 'miswired-home-button' ? ['deterministic', 'ai', 'ai-any-route'] : ['deterministic', 'ai'])) {
      await page.browser.goto(`${origin}/`);
      await expect(page.screen.getByTestId('home-products-button')).toBeVisible();
      await page.browser.evaluate((variant) => {
        const node = document.querySelector('[data-testid="home-products-button"]');
        if (!node) throw new Error('Home product control missing');
        if (variant === 'renamed-test-id') node.setAttribute('data-testid', 'renamed-home-products-button');
        if (variant === 'miswired-home-button') node.addEventListener('click', (event) => {
          event.preventDefault(); event.stopImmediatePropagation(); window.location.assign('/profile');
        }, { capture: true });
        return true;
      }, variant);
      let verdict = 'completed'; let code: string | null = null;
      const started = Date.now();
      try {
        if (flow === 'deterministic') await page.screen.getByTestId('home-products-button').tap({ timeout: 1500 });
        else await agent.act(flow === 'ai-any-route' ? 'Reach the Products catalog by any available route. If a home shortcut is broken, use another route to complete this user journey.' : 'Open Products from the home page.');
        await expect(page.browser).toHaveURL(`${origin}/products`, { timeout: 1500 });
      } catch (error) {
        code = (error as { code?: string }).code ?? 'unknown';
        if (!['ACTION_FAILED', 'ACTION_TIMEOUT', 'LOCATOR_NOT_FOUND', 'ASSERTION_FAILED', 'STEP_TIMEOUT'].includes(code)) throw error;
        verdict = 'failed';
      }
      const path = await page.browser.evaluate(() => location.pathname);
      recordProbe({ kind: 'flow-challenge', variant, flow, verdict, code, path, durationMs: Date.now() - started, contract: flow === 'ai-any-route' ? 'The user can reach /products by any available route; a broken shortcut may be bypassed.' : variant === 'miswired-home-button' ? 'The home product button must open /products.' : 'The user can reach the product catalog from home.' });
      if (variant === 'healthy' && verdict !== 'completed') throw new Error(`Healthy ${flow} control failed`);
    }
  }
  await page.browser.goto(`${origin}/products`);
  return true;
}
