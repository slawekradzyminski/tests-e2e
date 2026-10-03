import { readFileSync, writeFileSync } from 'node:fs';

// Standard direct-API USD rates verified on 2026-10-02; default 5-minute cache writes.
const pricing = {
  model: 'claude-sonnet-5-5', verifiedOn: '2026-10-02',
  source: 'https://platform.claude.com/docs/en/models/sonnet-5-5/overview',
  usdPerMillion: { freshInput: 2, cacheRead: 0.2, cacheWrite: 2.5, output: 10 },
};
const filename = process.argv[2];
if (!filename) throw new Error('Usage: node scripts/evaluate-cost.mjs <report.json> [output.json]');
const run = JSON.parse(readFileSync(filename, 'utf8')).run;
const selected = run.results.filter(result => result.selected);
const rows = selected.flatMap(result => result.attempts.flatMap(attempt => attempt.steps
  .filter(step => step.kind === 'agent').map(step => {
    const model = step.model;
    if (model && (model.model !== pricing.model || model.tokenAccounting !== 'provider')) {
      throw new Error(`Unsupported model or non-provider token accounting: ${model.model}`);
    }
    if (!model && !step.cache) throw new Error(`Missing model usage for ${step.api}`);
    const input = model?.inputTokens ?? 0;
    const read = model?.cacheReadTokens ?? 0;
    const write = model?.cacheWriteTokens ?? 0;
    const output = model?.outputTokens ?? 0;
    // AI SDK inputTokens includes cache reads and writes. Do not charge them twice.
    const fresh = input - read - write;
    if (fresh < 0) throw new Error('Cache token counts exceed total input tokens');
    const cost = (fresh * 2 + read * 0.2 + write * 2.5 + output * 10) / 1_000_000;
    return {
      stepId: step.id, startedAt: step.startedAt,
      file: result.file, titlePath: result.titlePath, repeat: result.repeat,
      api: step.api, label: step.label, status: step.status,
      modelCalls: model?.calls ?? 0, inputTokens: input, freshInputTokens: fresh,
      cacheReadTokens: read, cacheWriteTokens: write, outputTokens: output,
      estimatedUsd: cost, durationMs: step.durationMs,
      ...(step.cache ? { actionCache: step.cache.mode, actionCacheReason: step.cache.reason } : {}),
    };
  })));
const totals = group => ({
  steps: group.length,
  modelCalls: group.reduce((n, row) => n + row.modelCalls, 0),
  inputTokens: group.reduce((n, row) => n + row.inputTokens, 0),
  freshInputTokens: group.reduce((n, row) => n + row.freshInputTokens, 0),
  cacheReadTokens: group.reduce((n, row) => n + row.cacheReadTokens, 0),
  cacheWriteTokens: group.reduce((n, row) => n + row.cacheWriteTokens, 0),
  outputTokens: group.reduce((n, row) => n + row.outputTokens, 0),
  estimatedUsd: group.reduce((n, row) => n + row.estimatedUsd, 0),
});
const byApi = Object.fromEntries([...new Set(rows.map(row => row.api))].map(api => [api, totals(rows.filter(row => row.api === api))]));
const result = { report: filename, pricing, summary: run.summary, totals: totals(rows), byApi, steps: rows,
  limitations: 'Token-based estimate, not an invoice. Standard API rates, 5-minute cache writes, no tax, contractual discounts, or account credits. Action replay and provider prompt caching are accounted separately.' };
if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ summary: result.summary, totals: result.totals, byApi }, null, 2));
