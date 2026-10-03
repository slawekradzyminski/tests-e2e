import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const read = path => JSON.parse(readFileSync(path, 'utf8'));
const names = ['four-operations-live', 'wait-delayed-setup', 'wait-delayed-final', 'wait-never-ready', 'four-operations-repeat', 'four-operations-judgments', 'four-operations-ui', 'four-operations-replay'];
const runs = Object.fromEntries(names.map(name => {
  const costFile = `evaluation/${name}-cost.json`;
  const cost = read(costFile);
  const report = read(cost.report).run;
  const byApi = Object.fromEntries(Object.entries(cost.byApi).map(([api, group]) => {
    const rows = cost.steps.filter(step => step.api === api);
    const prices = rows.map(row => row.estimatedUsd).sort((a, b) => a - b);
    const middle = Math.floor(prices.length / 2);
    const medianUsd = prices.length % 2 ? prices[middle] : (prices[middle - 1] + prices[middle]) / 2;
    return [api, { ...group, meanUsd: group.estimatedUsd / group.steps, medianUsd, p90Usd: prices[Math.ceil(prices.length * 0.9) - 1] }];
  }));
  const actionReplay = Object.fromEntries([...new Set(cost.steps.filter(step => step.api === 'agent.act').map(step => step.actionCache ?? 'live'))].map(mode => [mode, cost.steps.filter(step => step.api === 'agent.act' && (step.actionCache ?? 'live') === mode).length]));
  return [name, { costFile, report: cost.report, summary: cost.summary, durationSeconds: (Date.parse(report.finishedAt) - Date.parse(report.startedAt)) / 1000, totals: cost.totals, byApi, actionReplay }];
}));
const probes = folder => readdirSync(folder).filter(file => file.endsWith('.json')).map(file => read(`${folder}/${file}`));
const delayed = probes('.e2e/wait-delayed-final-probes');
const neverReady = probes('.e2e/wait-never-ready-probes');
const previous = read('evaluation/scale-summary.json');
const newEstimatedUsd = Object.values(runs).reduce((sum, run) => sum + run.totals.estimatedUsd, 0);
const summary = {
  updatedOn: '2026-10-03',
  inventory: { scenarios: 68, act: 67, assert: 95, waitFor: 2, extract: 2, totalAiSteps: 166 },
  runs, waitChallenges: { delayed, neverReady },
  newEstimatedUsd,
  priorExpansionEstimatedUsd: previous.totalCurrentExpansionEstimatedUsd,
  combinedExpansionEstimatedUsd: previous.totalCurrentExpansionEstimatedUsd + newEstimatedUsd,
  reusedEvidence: {
    deterministic: previous.runs.deterministic,
    actions: previous.runs['live-actions'],
    reason: 'The additions are skipped when AI judgments are disabled; those profiles and their exact checks are unchanged. The earlier assertions-only and hybrid results are superseded by these new measurements.',
  },
  limitations: 'Small controlled sample, not a general flake rate. Hidden DOM panels simulate delayed/absent evidence; no production bug was discovered. Expected STEP_TIMEOUT failures are caught only in the negative challenge and the original exact checks run after restoration. USD is a provider-token estimate at the rates in each cost file, not an invoice. Four workers for full suites, three for focused live repeats, two for timing challenges. All new runs, including the setup failure, are included in the new cost total.',
};
writeFileSync('evaluation/four-operations-summary.json', JSON.stringify(summary, null, 2) + '\n');
const usd = value => `$${value.toFixed(4)}`;
const rows = Object.entries(runs).map(([name, run]) => `| ${name} | ${run.summary.passed}/${run.summary.executed} | ${run.durationSeconds.toFixed(2)} | ${run.totals.steps} | ${run.totals.modelCalls} | ${usd(run.totals.estimatedUsd)} |`).join('\n');
const live = runs['four-operations-ui'];
const breakdown = Object.entries(live.byApi).map(([api, group]) => `| ${api} | ${group.steps} | ${group.modelCalls} | ${usd(group.estimatedUsd)} | ${usd(group.meanUsd)} |`).join('\n');
const md = `# All four AI operations in the existing suite\n\nMeasured 3 October 2026 with Sonnet 5.5. No new scenarios: 68 UI tests, 234 unchanged API tests and the pre-existing smoke test. The UI suite now contains 67 actions, 95 assertions, two waits and two extractions: **166 AI steps**. Original exact UI and persisted-state checks remain.\n\n## Runs\n\n| Run | Passed | Seconds | AI steps | Model calls | Estimated USD |\n| --- | ---: | ---: | ---: | ---: | ---: |\n${rows}\n\nThe setup run failed in checkout because navigation had finished before the target panel rendered. The challenge now waits for the panel before hiding it. This was a harness problem, not a demonstrated AI failure. Its model costs are included.\n\n## Live full-suite costs\n\n| Operation | Steps | Calls | Total USD | Mean USD per step |\n| --- | ---: | ---: | ---: | ---: |\n${breakdown}\n\nNew measurements cost **${usd(newEstimatedUsd)}**, including failed setup and deliberately timed-out waits. Combined with the previous broad evaluation: **${usd(summary.combinedExpansionEstimatedUsd)}**. Earlier small experiments remain excluded.\n\n## What the waits demonstrated\n\n- Six delayed checks: all completed after a panel hidden for six seconds reappeared. Recorded wait durations: ${Math.min(...delayed.map(p => p.durationMs)) / 1000}–${Math.max(...delayed.map(p => p.durationMs)) / 1000} seconds. All observations confirm restoration before completion.\n- Four never-ready checks: all produced STEP_TIMEOUT at the eight-second deadline while the target remained hidden. The challenge catches that expected failure, restores the panel and continues the original exact checks. These are successful negative experiments, not successful AI conditions.\n- Checkout waits for order details, status, items and shipping information. Inventory waits for the selected product's quantity and named stock movement. Normal runs may find those conditions already ready after act.\n- Inventory extraction returns availableQuantity=13, delta=3 and the exact movement reason; the test compares all three values and also verifies persisted data through the API. Catalog extraction checks visible product order.\n\n## Reproduce\n\nUse the normal Anthropic key loader; never execute the shell profile.\n\n\`\`\`sh\nnpm run test:ai -- --tag four-operations --tag-mode all --no-cache --repeat-each 3 --workers 3\nE2E_FLOW=deterministic E2E_WAIT_CHALLENGE=delayed E2E_PROBE_DIR=.e2e/wait-delayed-probes npm run test:ai -- --tag four-operations --tag-mode all --grep 'places an order|selects a product' --no-cache --repeat-each 3 --workers 2\nE2E_FLOW=deterministic E2E_WAIT_CHALLENGE=never-ready E2E_PROBE_DIR=.e2e/wait-never-ready-probes npm run test:ai -- --tag four-operations --tag-mode all --grep 'places an order|selects a product' --no-cache --repeat-each 2 --workers 2\nnpm run test:ui -- --no-cache --workers 4\n\`\`\`\n\nSee [machine-readable observations and costs](four-operations-summary.json), [the earlier defect challenges](SCALE.md) and [selection heuristics](HEURISTICS.md). ${summary.limitations}\n`;
writeFileSync('evaluation/FOUR_OPERATIONS.md', md);
console.log(JSON.stringify({ inventory: summary.inventory, newEstimatedUsd, combinedExpansionEstimatedUsd: summary.combinedExpansionEstimatedUsd }));
