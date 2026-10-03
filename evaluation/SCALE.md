# Larger AI evaluation: coverage, fault detection and costs

Measured locally on 2 October 2026 with Sonnet 5.5, e2e 0.15.1, @e2e-dev/web 0.11.1, Chromium/Playwright 1.63.0, 1920 × 1080, and four workers against Awesome LocalStack's lightweight profile. Native e2e tests preserve all 302 source scenarios (234 API + 68 UI), plus the pre-existing smoke test. No dedicated scenarios were added in this expansion.

All **68 existing UI scenarios** now contain AI usage: **67 action goals + 95 semantic assertions + one extraction = 163 steps**. The separate smoke test adds one action when running the whole ai tag; it is excluded from this benchmark. All 234 API scenarios remain deterministic. Exact UI and API checks were retained, and fixtures still isolate disposable data.

## Same UI coverage, different profiles

| Profile | Passing | AI steps | Model calls | Duration | Estimated USD |
| --- | ---: | ---: | ---: | ---: | ---: |
| Deterministic UI | 68/68 | 0 | 0 | 21.03 s | $0.000000 |
| Live actions, exact assertions | 68/68 | 67 | 149 | 117.69 s | $1.210242 |
| Deterministic actions, live judgments/extraction | 68/68 | 96 | 96 | 103.42 s | $0.699344 |
| Live hybrid | 68/68 | 163 | 246 | 208.39 s | $1.963219 |
| Replay-enabled hybrid | 68/68 | 163 | 119 | 162.95 s | $0.972160 |

Live means action replay disabled, not provider prompt caching disabled. These are sequential observations, with changing provider cache warmth, generated data and model output; isolated profile costs do not have to sum exactly to the hybrid cost. Durations are wall time with four workers, without automatic retries. Selected UI runs exclude 235 unrelated scenarios; this does not mean source scenarios were removed or marked skip.

Replay-enabled action cache outcomes: **53 fully replayed, 7 handed off, 7 missed**. Judgments and extraction still call the model. The observed cost reduction against the live hybrid was **50.5%**. Cache misses/handoffs are billed and retained; replay passes are not independent live-reasoning trials. In this observation, six handoffs cited end-mismatch and one target-not-found; misses included target-not-found, wrong-context, target-ambiguous and no-entry. The inventory-adjustment handoff took 31.43 seconds. Model cost savings therefore did not translate proportionally into runtime savings.

The final deterministic and judgments-only runs verify the repaired fallback flows. Live hybrid and live actions measurements are reused for unchanged goals and oracles after adding an explicit product-save response wait; both already observed the completed save and passed that API check. The replay-enabled run additionally verifies that wait around AI/replayed actions.

## Cost distribution

| Operation | Live steps | Mean USD | Median USD | P90 USD | Min–max USD | Median / P90 duration |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| agent.act | 67 | $0.018758 | $0.017661 | $0.029140 | $0.009181–$0.035293 | 4.22 / 6.63 s |
| agent.assert | 95 | $0.007307 | $0.006944 | $0.012206 | $0.003856–$0.016580 | 2.85 / 4.71 s |
| agent.extract | 1 | $0.012228 | $0.012228 | $0.012228 | $0.012228–$0.012228 | 3.10 / 3.10 s |

Nearest-rank percentiles are computed over model-backed steps in the live hybrid. Action durations include their model interaction/tool execution; four workers overlap these durations, so they must not be summed as wall time. One extraction is not enough for a meaningful distribution estimate.

| Existing UI file | AI steps | Model calls | Estimated USD |
| --- | ---: | ---: | ---: |
| tests/ui/products.e2e.ts | 18 | 32 | $0.352438 |
| tests/ui/authenticated-header.e2e.ts | 26 | 36 | $0.296454 |
| tests/ui/home.e2e.ts | 18 | 25 | $0.198176 |
| tests/ui/checkout.e2e.ts | 14 | 19 | $0.142495 |
| tests/ui/cart.e2e.ts | 12 | 18 | $0.133349 |
| tests/ui/product-details.e2e.ts | 12 | 18 | $0.120714 |
| tests/ui/profile.e2e.ts | 8 | 14 | $0.111137 |
| tests/ui/login.e2e.ts | 9 | 14 | $0.094135 |
| tests/ui/admin-inventory.e2e.ts | 5 | 9 | $0.084128 |
| tests/ui/register.e2e.ts | 8 | 13 | $0.067533 |
| tests/ui/admin-products.e2e.ts | 4 | 5 | $0.060383 |
| tests/ui/edit-user.e2e.ts | 5 | 7 | $0.059652 |
| tests/ui/logged-out-header.e2e.ts | 7 | 10 | $0.057851 |
| tests/ui/edit-product.e2e.ts | 3 | 5 | $0.039089 |
| tests/ui/admin-dashboard.e2e.ts | 3 | 4 | $0.033466 |
| tests/ui/users.e2e.ts | 3 | 5 | $0.033121 |
| tests/ui/add-product.e2e.ts | 3 | 4 | $0.032595 |
| tests/ui/admin-orders.e2e.ts | 3 | 5 | $0.028165 |
| tests/ui/order-details.e2e.ts | 2 | 3 | $0.018339 |

By workload group: administration $0.370599; navigation-and-authentication $0.714149; commerce $0.767334; profile $0.111137. These are aggregates of differing numbers of tests/steps, not normalized feature difficulty.

### Scaling illustrations

At the measured live assertion mean, **100 comparable assertions cost $0.730708**, and **1,000 cost $7.307084**. One thousand comparable action goals cost $18.758469. One thousand complete live 68-scenario hybrid runs cost $1963.218900, versus $972.159800 at the observed replay-enabled rate. These are linear token/cache assumptions, not measured thousand-run loads or forecasts for different pages/models. Cost scales with screen size, reasoning, tool turns and caching as well as test count.

## Does the judge reject defects?

[The frozen fault catalog](challenge-catalog.json) lists the contract, selector, healthy value and wrong value. Challenge hooks run within eight existing tests. They catch expected failed/inconclusive judgments to record sensitivity, restore the DOM, and leave ordinary exact checks intact. Consequently an 8/8 green *harness* report is not a statement that faulty screens passed.

| Phase | Fault variants | Repetitions | Rejected | Inconclusive | Accepted | Healthy controls accepted |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Original strong prompts | 19 | 2 | 31 | 2 | 5 | 9/9 |
| Refined prompts, same frozen faults | 19 | 2 | 38 | 0 | 0 | 9/9 |
| Four additional variants, refined prompts unchanged | 4 | 2 | 8 | 0 | 0 | 4/4 |

Inconclusive judgments fail normal tests; initially 33/38 trials would therefore have blocked the run, but only 31 were definite rejections. The five accepted trials were a one-cent paid-order total error once, a checkout form total mismatch twice, and an optional-street error message twice. Checkout had another correct summary total; other address fields still had required messages. These exposed ambiguous or incomplete requirements rather than five interchangeable model mistakes. The repeated one-cent trial also showed answer variance.

Two prompt contracts were refined: paid orders explicitly require the *overall* total to agree with the lines, and checkout requires all five address fields and every displayed grand total to agree. The original faults stayed frozen. Additional variants changed a cart line quantity, order unit count, shipping country and the chat prompt's role; these were tried after refinement with no further prompt changes. Refined/additional trials verified the fault still held after judgment.

Six deliberately broad-oracle trials all accepted faulty screens. A page can have a readable summary while its numbers are wrong. One hidden-state trial changed disposable persisted stock from 13 to 14 while the screen remained 13: the screen judgment accepted it, the API comparison detected it, and cleanup restored 13. This demonstrates the screen-only observation limit.

These are deliberately injected faults, not naturally discovered production bugs. No production application defect was demonstrated. This small chosen sample does not establish a general false-positive rate, model ranking, or long-term flake rate. Healthy larger runs passed after the test/prompt repairs, but first-attempt failures remain part of the evidence.

## Flow challenges

The existing home-to-Products scenario runs temporary healthy, renamed-ID and miswired-button variants. Both flows use an exact final URL oracle. The miswired button routes to Profile.

| Variant | Deterministic existing test-ID flow | AI goal constrained to opening Products from home | AI goal explicitly allowing any route |
| --- | --- | --- | --- |
| Healthy | Completed, 42 ms | Completed, 4.02 s | — |
| Renamed test ID | Locator failed | Completed, 4.01 s | — |
| Miswired home shortcut | Exact URL assertion failed | Action failed on Profile | Completed via another route, 4.13 s |

A stable accessible deterministic locator might also survive the ID rename; this experiment compared the existing test-ID implementation. The alternate-route completion fulfills a permissive journey goal but would miss the shortcut-specific defect. The strict AI failure is encouraging evidence from one injected route fault, not a guarantee that agents always preserve path contracts. See [heuristics](HEURISTICS.md).

## Failed attempts and total experiment spending

| Retained first attempt | Passing | Estimated USD | Repair |
| --- | ---: | ---: | --- |
| initial-hybrid | 66/68 | $2.012062 | Two assertions incorrectly described the LLM hub as a composer. |
| initial-actions | 67/68 | $1.023613 | Invalid-login toast expired while the agent produced its completion verdict; kept its trigger deterministic. |
| initial-judgments | 67/68 | $0.689098 | Named forbidden inventory controls explicitly; screen judges have no action history. |
| judgments-save-race | 67/68 | $0.691346 | Product API read raced an in-flight save in the deterministic edit fallback; awaited the save response. |

| Challenge run | Harness scenarios passing | Judgment/action steps | Estimated USD |
| --- | ---: | ---: | ---: |
| fault-original | 8/8 | 61 | $0.448072 |
| fault-refined | 8/8 | 61 | $0.434216 |
| fault-heldout | 3/3 | 16 | $0.110313 |
| flow-original | 1/1 | 4 | $0.102265 |
| flow-broad | 1/1 | 5 | $0.127853 |

All **15 retained commands in this larger expansion** cost **$10.483802**, including failed attempts and the fault challenges. Earlier 22-step experiments in [ACTIONS.md](ACTIONS.md) and the initial semantic experiment in [COSTS.md](COSTS.md) are separate historical budgets and are not included in this total.

Costs use provider token accounting and [official Sonnet 5.5 pricing](https://platform.claude.com/docs/en/models/sonnet-5-5/overview), verified on 2 October 2026: fresh input 2, cache read 0.20, default five-minute cache write 2.50 and output 10 USD per million tokens. Fresh input = total input − cache reads − cache writes. Failed model steps count; fully replayed actions have zero model tokens. Estimates exclude taxes, credits, discounts, machine cost and developer time. [Machine-readable summary](scale-summary.json) retains per-file/API distributions and each safe probe observation. Original reports/traces remain under .e2e/ and are not edited.

## Reproduce

```sh
npm run test:deterministic -- --workers 4
npm run test:actions -- --no-cache --workers 4
npm run test:judgments -- --no-cache --workers 4
npm run test:ui -- --no-cache --workers 4
npm run test:ui -- --workers 4 --output .e2e/new-ui-run

# Existing semantic scenarios with original frozen screen/state faults
E2E_FLOW=deterministic E2E_CHALLENGE=judgment \
  E2E_PROBE_DIR=.e2e/new-judgment-probes \
  npm run test:ai -- --tag challenge --tag-mode all --no-cache --workers 4

# Additional variants, prompts unchanged
E2E_FLOW=deterministic E2E_CHALLENGE=judgment E2E_PROBE_SET=heldout \
  E2E_PROBE_DIR=.e2e/new-heldout-probes \
  npm run test:ui -- --grep 'updates a line|filters orders|saves personal information' \
  --no-cache --workers 4

# Existing home catalog scenario with temporary route/locator faults
E2E_CHALLENGE=flow E2E_PROBE_DIR=.e2e/new-flow-probes \
  npm run test:ui -- --grep 'opens the product catalog' --no-cache --workers 1

npm run typecheck
npm run verify:coverage
npm run cost:report -- .e2e/new-ui-run/report.json evaluation/new-ui-run-cost.json
node scripts/summarize-evaluation.mjs
node scripts/write-scale-report.mjs
```

Use a new probe directory per experiment to avoid merging observations from separate runs. Two repetitions are the default; E2E_PROBE_REPEATS controls them. Original cost files and frozen observations are evidence, not files to overwrite during reproduction. [Coverage verification](coverage-verification.json) confirms 302 original identities, one pre-existing extra, zero missing and zero skipped source scenarios. Type checking and the final affected UI runs passed; unchanged API baseline evidence is reused.
