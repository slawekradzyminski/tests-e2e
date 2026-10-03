# Semantic expansion: first measurements

Historical experiment. See the [larger 68-scenario evaluation](SCALE.md) for the current inventory, fault challenges and costs.

This records the first semantic expansion. The current 22-step inventory and the later action evaluation are in [ACTIONS.md](ACTIONS.md).

On 2 October 2026, eight semantic assertions were added to existing scenarios while retaining their exact UI and persisted-state checks. The current inventory is **14 AI steps across 11 scenarios**: four `agent.act` goals, nine `agent.assert` judgments, and one `agent.extract` structured read with an exact comparison. The suite still contains all 302 original scenarios plus one smoke test.

## Added assertions

| Check | Purpose |
| --- | --- |
| Combined cart | Interpret quantities across two lines and relate them to the combined total |
| Empty cart | Confirm the empty-state message agrees with the navigation cart state |
| Inventory movement | Relate a +3 movement and its reason to stock increasing from 10 to 13 |
| Edited catalog product | Associate the edited product with its updated price and stock |
| Saved assistant prompts | Judge the meaning of the separately saved chat/tool prompts after reload |
| Missing checkout address | Interpret required-field feedback and the retained order summary |
| Unavailable checkout stock | Judge the recovery message and preservation of the shipping form |
| Out-of-stock product | Confirm the stock message agrees with the disabled purchase action |

The assertions use the accessible screen tree, without requesting screenshots. Fake product names can vary per attempt. Deterministic checks remain responsible for exact field values and API state; the semantic checks assess related facts and their meaning together.

## Verification

- First expanded run: 11/11 AI-enabled scenarios passed with action replay disabled.
- New-check repetitions: seven scenarios ran three times, giving 21/21 passing scenario attempts and 24/24 passing semantic judgments.
- Replay run: 11/11 passed; all four agent actions replayed, while nine assertions and one extraction called Sonnet live.
- Across these runs, the eight newly added assertions passed 40/40 executions without retries. This is a small local sample, not an established long-term flake rate.
- Type checking and exact source-scenario coverage verification passed. Passing evidence for unchanged deterministic scenarios was retained from the earlier complete 303-test run; this expansion did not rerun those unchanged tests.

## Measured estimates

| Workload | Live model calls | Estimated USD |
| --- | ---: | ---: |
| All 11 AI scenarios, action replay disabled | 20 | $0.191994 |
| All 11 AI scenarios, all four actions replayed | 10 | $0.079275 |
| Eight new assertions, first run | 8 | $0.065404 |
| Eight new assertions, mean over three repetition runs | 8 | $0.062634 |
| All three evaluation commands in this expansion | 54 | $0.459172 |

The added assertions average **$0.007829 each**. Their measured per-check averages range from about **$0.0047 to $0.0137**; the edited-product catalog check is most expensive because its screen includes a larger catalog observation. Provider latency also varies: for example, stock-feedback judgments took roughly 2.6–7.3 seconds across observed calls, even though their token cost was small.

Action replay reduced the observed AI cost by **58.7%** between these runs. At the observed replay-run rate, 1,000 comparable executions would cost about **$79.28**. That projection assumes similar screen size, model output, prompt caching, pricing, and successful action replay; cache misses or retries add cost. These two runs are measurements rather than a controlled identical-token comparison.

All semantic judgments run live. `--no-cache` disables e2e's action replay but leaves Anthropic prompt caching operational. Stable system prompts benefited from provider caching, while changing user/product data limited reuse of the screen observations. The replay run's bill consisted of nine assertions ($0.067794) and one extraction ($0.011481); replayed browser actions incurred no model-token charges.

## Pricing and calculation

The estimates use [Anthropic's official Sonnet 5.5 prices](https://platform.claude.com/docs/en/models/sonnet-5-5/overview), verified on 2 October 2026: $2 per million fresh input tokens, $0.20 per million cache-read tokens, $2.50 per million default five-minute cache-write tokens, and $10 per million output tokens.

The runner reports provider-accounted input/output tokens and separate cache-read/write counts. AI SDK total input includes cached tokens, so the calculation subtracts them before charging fresh-input tokens:

```text
fresh_input = total_input - cache_reads - cache_writes
USD = (2 × fresh_input + 0.20 × cache_reads + 2.50 × cache_writes + 10 × output) / 1,000,000
```

These are token-based estimates, not account invoices. They exclude taxes, contractual discounts, credits, and local machine costs. The reporter validates the model and provider accounting, rejects impossible token totals, and gives replayed steps zero token cost.

## Reproduce and inspect

```sh
npm run test:ai -- --no-cache --output .e2e/expanded-ai --ai-trace --workers 4
npm run test:semantic -- --no-cache --repeat-each 3 --output .e2e/semantic-stability --workers 4
npm run test:ai -- --output .e2e/expanded-replay --workers 4
npm run cost:report -- .e2e/expanded-ai/report.json evaluation/expanded-ai-cost.json
npm run cost:report -- .e2e/expanded-replay/report.json evaluation/expanded-replay-cost.json
```

`semantic-expansion-summary.json` contains the compact inventory, verification, cost comparison, and per-check means. Detailed token/cost records are in `expanded-ai-cost.json`, `semantic-stability-cost.json`, and `expanded-replay-cost.json`. Original-run estimates are retained separately for reference; they are not included in this expansion's $0.459172 total.
