# More active AI usage in existing tests

Historical experiment. See the [larger 68-scenario evaluation](SCALE.md) for the current inventory, fault challenges and costs.

The latest expansion changes six existing scenarios, without adding test scenarios. All 302 source scenarios plus the existing smoke test remain. There are now 22 AI steps in 14 scenarios: 10 actions, 11 semantic assertions, one extraction.

Six added goals edit four product fields and save, add three stock units with a reason, mark an order PAID, cancel an order through confirmation, search BETA within the selected category, and sort descending. Paid and cancelled order views also have new semantic judgments. Original exact checks, rejected cancellation, persisted state, restored stock, and cleanup remain.

## Results and costs

| Run | Pass | Calls | Estimated USD |
| --- | ---: | ---: | ---: |
| Initial live | 13/14 | 39 | 0.338985 |
| Repaired live | 14/14 | 37 | 0.258985 |
| Six changed scenarios repeated three times live | 18/18 | 74 | 0.523829 |
| Replay enabled, four old hits/six new misses | 14/14 | 27 | 0.195556 |
| Warm, nine full replays/one handoff | 14/14 | 13 | 0.098456 |

Total latest experiment: **$1.415811**, including the failed first run. Standard Sonnet 5.5 API token estimates, not invoices; see [pricing and calculation](COSTS.md). Each JSON cost report retains per-step tokens, failed attempts, and API costs. Independent Decimal arithmetic confirmed all five totals.

The initial product action saved correct values but tapped Update Product twice and navigated to the catalog to verify success. The next editor assertion found no input. The prompt now says to save once and finish on the editor; the test explicitly reopens the editor before its reload checks. The failed run is retained in `act-expanded-initial-cost.json`.

Six changed scenarios passed every one of three live repetitions, without retries: 21 acts, 12 assertions, three extractions. This is repeatability against a healthy local app, not a measured false-positive or long-term flake rate. The warm cancellation replay hit an `end-mismatch`: its click replayed and Sonnet confirmed CANCELLED with one model call. Exact cancellation, removed control, persisted status and restored stock checks passed.

Repaired live runtime 45.77 seconds; warm runtime 30.35 seconds. Cancellation handoff took 17.69 seconds in the warm run. Cost decreased roughly 62%, but latency did not fall proportionally. A similar 1,000-run workload would cost about $98.46 at the observed warm rate, conditional on similar screen size, pricing, output and cache behaviour.

Typecheck and exact source-scenario coverage checks passed. Unchanged deterministic scenarios reuse the earlier complete 303/303 result. The current 14 affected AI scenarios passed in both live and cache-enabled modes.

## Reproduce

```sh
npm run test:ai -- --no-cache --workers 4 --output .e2e/act-expanded-final
npm run test:ai -- --tag act-expansion --tag-mode all --no-cache --repeat-each 3 --workers 4 --output .e2e/act-expanded-stability
npm run test:ai -- --workers 4 --output .e2e/act-expanded-replay
npm run test:ai -- --workers 4 --output .e2e/act-expanded-warm
npm run cost:report -- .e2e/act-expanded-warm/report.json evaluation/act-expanded-warm-cost.json
```

`--no-cache` turns off e2e's action cache. The first subsequent cache-enabled run populated the six new entries. Provider prompt caching remains independent. The compact inventory and run totals are in `act-expansion-summary.json`.
