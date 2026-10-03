# All four AI operations in the existing suite

Measured 3 October 2026 with Sonnet 5.5. No new scenarios: 68 UI tests, 234 unchanged API tests and the pre-existing smoke test. The UI suite now contains 67 actions, 95 assertions, two waits and two extractions: **166 AI steps**. Original exact UI and persisted-state checks remain.

## Runs

| Run | Passed | Seconds | AI steps | Model calls | Estimated USD |
| --- | ---: | ---: | ---: | ---: | ---: |
| four-operations-live | 3/3 | 27.90 | 16 | 26 | $0.2631 |
| wait-delayed-setup | 3/6 | 50.72 | 15 | 21 | $0.1717 |
| wait-delayed-final | 6/6 | 60.70 | 21 | 30 | $0.2182 |
| wait-never-ready | 4/4 | 37.17 | 14 | 16 | $0.1151 |
| four-operations-repeat | 9/9 | 71.01 | 48 | 78 | $0.7071 |
| four-operations-judgments | 68/68 | 103.64 | 99 | 101 | $0.7375 |
| four-operations-ui | 68/68 | 199.59 | 166 | 249 | $1.9921 |
| four-operations-replay | 68/68 | 181.98 | 166 | 126 | $1.0346 |

The setup run failed in checkout because navigation had finished before the target panel rendered. The challenge now waits for the panel before hiding it. This was a harness problem, not a demonstrated AI failure. Its model costs are included.

## Live full-suite costs

| Operation | Steps | Calls | Total USD | Mean USD per step |
| --- | ---: | ---: | ---: | ---: |
| agent.act | 67 | 150 | $1.2634 | $0.0189 |
| agent.assert | 95 | 95 | $0.6958 | $0.0073 |
| agent.waitFor | 2 | 2 | $0.0143 | $0.0072 |
| agent.extract | 2 | 2 | $0.0186 | $0.0093 |

New measurements cost **$5.2394**, including failed setup and deliberately timed-out waits. Combined with the previous broad evaluation: **$15.7232**. Earlier small experiments remain excluded.

## What the waits demonstrated

- Six delayed checks: all completed after a panel hidden for six seconds reappeared. Recorded wait durations: 8.787–9.442 seconds. All observations confirm restoration before completion.
- Four never-ready checks: all produced STEP_TIMEOUT at the eight-second deadline while the target remained hidden. The challenge catches that expected failure, restores the panel and continues the original exact checks. These are successful negative experiments, not successful AI conditions.
- Checkout waits for order details, status, items and shipping information. Inventory waits for the selected product's quantity and named stock movement. Normal runs may find those conditions already ready after act.
- Inventory extraction returns availableQuantity=13, delta=3 and the exact movement reason; the test compares all three values and also verifies persisted data through the API. Catalog extraction checks visible product order.

## Reproduce

Use the normal Anthropic key loader; never execute the shell profile.

```sh
npm run test:ai -- --tag four-operations --tag-mode all --no-cache --repeat-each 3 --workers 3
E2E_FLOW=deterministic E2E_WAIT_CHALLENGE=delayed E2E_PROBE_DIR=.e2e/wait-delayed-probes npm run test:ai -- --tag four-operations --tag-mode all --grep 'places an order|selects a product' --no-cache --repeat-each 3 --workers 2
E2E_FLOW=deterministic E2E_WAIT_CHALLENGE=never-ready E2E_PROBE_DIR=.e2e/wait-never-ready-probes npm run test:ai -- --tag four-operations --tag-mode all --grep 'places an order|selects a product' --no-cache --repeat-each 2 --workers 2
npm run test:ui -- --no-cache --workers 4
```

See [machine-readable observations and costs](four-operations-summary.json), [the earlier defect challenges](SCALE.md) and [selection heuristics](HEURISTICS.md). Small controlled sample, not a general flake rate. Hidden DOM panels simulate delayed/absent evidence; no production bug was discovered. Expected STEP_TIMEOUT failures are caught only in the negative challenge and the original exact checks run after restoration. USD is a provider-token estimate at the rates in each cost file, not an invoice. Four workers for full suites, three for focused live repeats, two for timing challenges. All new runs, including the setup failure, are included in the new cost total.
