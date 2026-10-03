import type { Agent } from 'e2e';

/** Runs the same original scenario through either implementation for paired measurements. */
export async function act(agent: Agent, goal: string, fallback: () => Promise<unknown>, options?: Parameters<Agent['act']>[1]) {
  if (process.env.E2E_FLOW === 'deterministic') return fallback();
  return agent.act(goal, options);
}
export async function assertMeaning(agent: Agent, statement: string, options?: Parameters<Agent['assert']>[1]) {
  if (process.env.E2E_ASSERTIONS === 'off') return;
  await agent.assert(statement, options);
}
