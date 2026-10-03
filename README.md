# e2e / Sonnet evaluation

A standalone recreation of the `hyr21` Playwright suite using [TesterArmy e2e](https://tester.army/e2e): **234 API scenarios + 68 UI scenarios**, plus one AI smoke test. Tests register with `@e2e-dev/web` and assert with `e2e`. Playwright is only the browser engine; the Playwright test runner is not a dependency.

The source is pinned to [`94dccc8`](https://github.com/slawekradzyminski/playwright-2026/tree/94dccc853d421746956ea2691ed5c4fcaa81bf95). The new project has no dependency on that checkout. [Coverage verification](evaluation/coverage-verification.json) compares every source scenario's file and full title path, including parameterized cases.

## Run locally

Use Node.js 24 and Docker with Compose. Clone the demo and [Awesome LocalStack](https://github.com/slawekradzyminski/awesome-localstack) into the same parent directory, then start the lightweight training stack:

```sh
git clone https://github.com/slawekradzyminski/awesome-localstack.git
git clone https://github.com/slawekradzyminski/tests-e2e.git
cd awesome-localstack
docker compose -f lightweight-docker-compose.yml up -d --wait
cd ../tests-e2e
npm ci
npx playwright install chromium
export ANTHROPIC_API_KEY="your-api-key"
npm test
```

The default gateway is `http://localhost:8081`. Copy `.env.example` to `.env` to override the URL or demo credentials. UI tests use Chromium at 1920 × 1080.

`npm test`, `test:ui`, `test:ai`, and `test:smoke` load `ANTHROPIC_API_KEY` from the environment, or read its literal assignment from `~/.zshrc`. The loader never executes the profile or prints the key. The default model is `claude-sonnet-5-5`; `ANTHROPIC_MODEL` can override it.

```sh
npm run test:api           # deterministic API tests; no model calls
npm run test:ui
npm run test:ai            # all 68 UI scenarios plus the existing AI smoke test
npm run test:smoke
npm run test:semantic      # the focused semantic subset
npm run test:deterministic # original UI actions, AI judgments disabled
npm run test:actions       # AI actions, judgments disabled
npm run test:judgments     # deterministic actions, live judgments
npm run cost:report -- .e2e/expanded-ai/report.json
npm run typecheck
npm run verify:coverage
npm run test:ai -- --no-cache --output .e2e/cold-ai
```

Each runner invocation writes reports, traces, and cache entries under `.e2e/`. The cache replays agent actions; semantic judgments and extraction still call Sonnet. Use `--no-cache` to measure live agent execution.

## Larger AI evaluation

All 68 existing UI scenarios now use AI: **67 action goals, 95 semantic assertions, two semantic waits and two structured extractions (166 AI steps)**, with their original exact UI and persisted-state checks retained. The separate original smoke scenario adds one more action when running `test:ai`. The 234 API scenarios remain deterministic. No dedicated scenarios were added for this expansion.

Actions cover navigation, authentication, catalog search/sort, cart changes, checkout, profile edits, order status/cancellation, product and user administration, and inventory adjustments. Judgments inspect visible relationships, saved values, recovery messages and restricted screens. `pages/` keeps selectors and flow logic out of test definitions.

The same UI suite supports deterministic, actions-only, judgments-only and hybrid profiles through `support/ai-evaluation.ts`. The invalid-login submit remains deterministic because the original exact toast check must run immediately. AI checks supplement exact oracles.

See [all four operations, repeated runs and updated costs](evaluation/FOUR_OPERATIONS.md), [the earlier defect challenges and cost distributions](evaluation/SCALE.md), and [flow-selection heuristics](evaluation/HEURISTICS.md). Temporary screen faults and a disposable inventory-state challenge execute inside selected existing scenarios; they do not alter application source or add test scenarios. [The earlier 22-step experiment](evaluation/ACTIONS.md) is retained as historical evidence.

Endpoint clients use a small fetch transport; streaming checks read SSE bytes directly. Setup and teardown create and remove isolated users, products, carts, and orders through the API.

## Structure

- `tests/api/`, `tests/ui/`: source scenarios recreated as native `.e2e.ts` tests.
- `pages/`, `pages/components/`: native screen/browser actions and assertions.
- `fixtures/`: isolated data factories and page construction.
- `support/fixtures.ts`: selects each scenario's dependency graph, because e2e custom fixtures are eager. This prevents unrelated fixtures from creating or deleting data.
- `clients/`, `validators/`, `generators/`, `types/`: endpoint contracts, response checks, and fake data.
- `evaluation/`: source coverage, verified mapping, and measured results.
- `.agents/skills/e2e/`: the framework's project-local agent guidance.

The GitHub Actions workflow starts a pinned lightweight stack, checks types and coverage, runs the suite, and uploads evidence. Set the repository secret `ANTHROPIC_API_KEY` before using it. CI has been authored but has not been executed on GitHub.

See [the initial evaluation](evaluation/RESULTS.md) for migration details and [the earlier semantic expansion](evaluation/COSTS.md) for historical cost evidence.
