# Evaluation: 2 October 2026

The subsequent expansion adds eight semantic assertions, bringing the current inventory to 14 AI steps across 11 scenarios. See [expanded checks and costs](COSTS.md) for verification and measured spending. The results below preserve the initial evaluation.

The tool works with Anthropic Sonnet 5.5 on the local lightweight training stack. The complete final run passed **303/303 tests across 64 files**, with no skips, flaky tests, or retries. Coverage mapping confirms all **302 original scenarios**: 234 API and 68 UI tests; the additional test is the initial AI smoke test.

| Check | Observed result |
| --- | --- |
| Sonnet API access | Key loaded from `~/.zshrc`; model listed by Anthropic |
| Initial live smoke | Passed on the shared training app; repeated successfully on localhost |
| Live AI UI execution before caching | Checkout, sorting/extraction, and search recovery passed; 10 model calls, 97,948 tokens |
| Final complete local run | 303 passed; 71.051 seconds with four workers |
| Final AI usage | 4 live model calls; 26,389 tokens, including 17,492 Anthropic prompt-cache tokens |
| Action replay in final run | Three complex actions replayed: five checkout fills, one sorting action, one clear-search action |
| Exact coverage mapping | 302 source scenarios matched; no missing or skipped scenarios |
| Uncached stability probe | All four AI scenarios passed all three repetitions: 12/12 scenario runs, 18/18 AI steps; 33 live model calls, no retries |
| Clean install | `npm ci` completed; type and coverage checks passed afterward |

The final model calls were the smoke navigation (two), checkout judgment (one), and catalog extraction (one). Action replay and Anthropic prompt caching are separate mechanisms. The replayed actions required no model calls; judgments and extraction remained live. The subsequent stability probe disabled action replay and repeated each AI scenario three times. All 12 scenario runs and all 18 AI steps passed, using 33 live model calls over 47.947 seconds. Provider prompt caching still operated; it does not replay actions or replace model inference. These runs support stability in this sample, but do not establish a reliable long-term flake rate or a performance comparison with Playwright.

## Original AI step inventory (before expansion)

Four of the 303 scenarios use AI (about 1.3%). They contain four `agent.act` goals, one `agent.assert` semantic judgment, and one `agent.extract` structured read followed by exact comparison: six AI steps in total. Every acting goal also has exact deterministic outcome checks.

## Adaptations required

1. **Fixture lifecycle:** e2e runs all custom fixtures in a test's extension chain eagerly and in registration order. The source depended on lazy fixtures and `mergeTests`. Native per-scenario fixture selection now includes only the required dependency graph, preserving isolation and teardown order.
2. **HTTP transport:** API tests use fetch. The order-status client passes the status string once for JSON encoding; copying the original pre-encoded Playwright payload initially encoded it twice. The repaired cancellation and status suites passed, followed by the entire API suite.
3. **Select controls:** e2e interprets a string as an option label. Status controls now use `{ value: status }` to preserve the source's value selection.
4. **Rendered text:** e2e observed the home email after CSS uppercase transformation. The original check used DOM text. A native `browser.evaluate` inside `expect.poll` preserves the exact DOM-text assertion.
5. **Responses and dialogs:** native response waits use full-URL globs; native dialog handlers replace raw page events. Existing persisted-state checks still confirm the business outcomes.
6. **Secrets:** password fields receive declared opaque secret handles, including generated registration passwords supplied through a fill-time provider. The API key is never written to the project.
7. **Model compatibility:** the AI SDK warned that Sonnet 5.5 rejects forced tool choice and used `auto`. Actual tool calls and exact outcome assertions passed in the live runs. The warning remains visible.

## Evidence and scope

The original source is [`hyr21` at `94dccc8`](https://github.com/slawekradzyminski/playwright-2026/tree/94dccc853d421746956ea2691ed5c4fcaa81bf95). `source-coverage.json` freezes its collected scenario identities; `coverage-verification.json` records the matching native list. The source checkout was used for reference and collection only and is not required to run this project.

Local reports: `.e2e/local-smoke/`, `.e2e/ui/` (live complex AI calls), `.e2e/api-repair/`, `.e2e/ui-repair/`, `.e2e/final/`, and `.e2e/stability/` (three uncached repetitions). The final report is `.e2e/final/report.json`; the human-readable summary is `.e2e/final/summary.md`, and model diagnostics are `.e2e/final/ai-trace.json`. These outputs are ignored by Git. `final-results.json` and `stability-results.json` preserve compact result records without transcripts or credentials.

The local stack came from `awesome-localstack` at `0bc674e957e7fbc0a35f880ff71497832bffaeac`, using the lightweight profile: backend/frontend 3.8.1 and Ollama mock 1.0.9. The stack remains running. GitHub Actions configuration is provided; no remote CI run, push, or publication was performed.
