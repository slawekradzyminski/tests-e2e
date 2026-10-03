import type { Agent } from 'e2e';
import { expect } from 'e2e';
import type { PageContext } from './fixtures';
import { recordProbe } from './challenges';

/** Optional timing challenges run inside the existing scenario, with its exact checks retained. */
export async function waitForMeaning(page: PageContext, agent: Agent, statement: string, target: { selector: string; leafText?: string }) {
  if (process.env.E2E_ASSERTIONS === 'off') return;
  const mode = process.env.E2E_WAIT_CHALLENGE;
  if (mode !== 'delayed' && mode !== 'never-ready') {
    await agent.waitFor(statement, { timeout: 30_000, interval: 500 });
    return;
  }
  // This timer simulates a late-rendered result. It is not used to synchronize the test.
  const setup = await page.browser.evaluate(spec => {
    const roots = [...document.querySelectorAll(spec.selector)];
    const node = spec.leafText ? roots.flatMap(root => [root, ...root.querySelectorAll('*')]).find(el => !el.children.length && el.textContent?.trim() === spec.leafText) : roots[0];
    if (!node) throw new Error('Wait challenge target is missing');
    const saved = { node: node as HTMLElement, originalHidden: (node as HTMLElement).hidden, restored: false, timer: 0 };
    (window as any).__e2eWaitProbe = saved;
    saved.node.hidden = true;
    if (spec.mode === 'delayed') saved.timer = window.setTimeout(() => { saved.node.hidden = saved.originalHidden; saved.restored = true; }, 6000);
    return { originallyHidden: saved.originalHidden, hiddenAfterSetup: saved.node.hidden };
  }, { selector: target.selector, leafText: target.leafText ?? null, mode });
  const started = Date.now();
  let verdict = 'completed'; let code: string | null = null;
  try {
    expect(setup.originallyHidden).toBe(false);
    expect(setup.hiddenAfterSetup).toBe(true);
    try { await agent.waitFor(statement, { timeout: mode === 'never-ready' ? 8000 : 30_000, interval: 500 }); }
    catch (error) {
      code = (error as { code?: string }).code ?? null;
      if (code !== 'STEP_TIMEOUT') throw error;
      verdict = 'timed-out';
    }
    const state = await page.browser.evaluate(() => {
      const saved = (window as any).__e2eWaitProbe;
      return { hidden: saved.node.hidden, restored: saved.restored };
    });
    recordProbe({ kind: 'wait-challenge', mode, statement, target, verdict, code, durationMs: Date.now() - started, ...state });
    if (mode === 'delayed') { expect(verdict).toBe('completed'); expect(state.restored).toBe(true); expect(state.hidden).toBe(false); }
    else { expect(verdict).toBe('timed-out'); expect(state.hidden).toBe(true); }
  } finally {
    await page.browser.evaluate(() => {
      const saved = (window as any).__e2eWaitProbe;
      window.clearTimeout(saved.timer);
      saved.node.hidden = saved.originalHidden;
      delete (window as any).__e2eWaitProbe;
      return true;
    });
  }
}
