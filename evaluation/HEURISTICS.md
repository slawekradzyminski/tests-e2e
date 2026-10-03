# Choosing deterministic actions, AI actions and semantic judgments

This is a decision guide from the local Sonnet experiment, not a rule that every high-level test should use AI. The existing exact UI/API oracles remain the reference.

| Question | Prefer | Reason and evidence |
| --- | --- | --- |
| Is this exact control, route, field, event or sequence the requirement? | Deterministic action and assertion | An agent allowed to reach Products by any route bypassed a deliberately broken home shortcut. Completing the journey would miss the shortcut defect. |
| Does the requirement allow several routes to the same business outcome? | Bounded `agent.act` with exact outcome checks | AI reached Products despite a renamed test ID. Specify permitted routes, stopping point and side-effect limits. A stable accessible locator could also survive that ID change. |
| Is a number, status, permission or persisted value critical? | Exact UI/API assertion | A screen-only inventory judgment accepted visible 13 while the API reported 14. Screen agreement cannot establish persistence or authorization. |
| Does the requirement concern meaning or consistency across visible evidence? | `agent.assert` alongside exact checks | Cart arithmetic, recovery feedback and saved prompt meaning were useful challenge targets. A generic “has a summary” assertion correctly accepted a page containing a wrong total. |
| Is readiness a semantic condition rather than a specific element or response? | `agent.waitFor`, followed by exact checks | Checkout and inventory waited for panels hidden for six seconds in six trials; four absent-panel trials timed out. Use an ordinary locator/response wait when that already expresses readiness clearly. |
| Do we need structured information from variable page content? | `agent.extract` with a schema and independent comparison | Catalog product order and inventory quantity/movement are checked against expected values. A schema checks structure; it does not establish that the extracted facts are correct. Stable known fields are cheaper to read directly. |
| Can latency accidentally synchronize an asynchronous operation? | Explicit response/state wait | A deterministic product-edit fallback read stale API values while the form was Saving; AI reasoning latency had hidden that race. |
| Does the next check observe short-lived feedback? | Deterministic trigger and immediate exact check | AI clicked invalid-login submit correctly, but its final reasoning outlasted the five-second toast. Waiting for agent completion lost the observation window. |
| Is the interaction trivial and stable? | Deterministic flow | The healthy Products click took 42 ms; AI took about four seconds in the small routing challenge. The experiment intentionally overuses AI to measure that overhead. |
| Is the page ambiguous or does it repeat values? | Explicit, self-contained judgment | Name the overall total, form total and summary total separately. A correct line total did not initially make the model reject a wrong overall total. |
| Does the statement depend on previous actions? | Restate visible facts or use an exact history/state oracle | `agent.assert` judges the current screen, without action history. “The requested administration screen” was inconclusive; naming the forbidden inventory controls fixed it. |
| Is this a broad end-user journey? | AI may help, but keep precise boundaries | Low-level/high-level is a useful starting point. Whether the path is contractual and whether the outcome is observable are the decisive questions. |

## A practical allocation

1. Keep API contracts, setup/cleanup, money, quantities, permissions, persistence and narrowly scoped regression tests deterministic.
2. Select a smaller portfolio of business journeys for AI actions: recovery, multi-field forms, confirmation flows, or navigation where alternate routes are allowed.
3. Use semantic assertions for requirements whose meaning matters more than exact wording; state all relevant visible facts explicitly.
4. Challenge those assertions with plausible incorrect screens and healthy controls before trusting them. Preserve the original faults when refining the oracle, then add previously untested variants without changing the prompt.
5. Measure healthy passes, rejected faults, inconclusive faults, accepted faults, latency and cost separately. Replay passes are not additional live-reasoning trials.

An AI goal must say what to do, how many times a side effect may occur, which route constraints apply, and where to stop. An exact assertion must then independently establish success. This does not guarantee exactly-once effects merely because the prompt says “once”; the surrounding state/count oracles must verify the required effect.

## What the experiment establishes

After repairs, all 68 existing UI scenarios passed with live AI actions and judgments. The original fault catalog had 19 temporary DOM faults, each attempted twice. Initially 31 were rejected, two were inconclusive, and five were accepted. Since inconclusive assertions fail tests, 33 trials would have blocked a normal run. Refined prompts rejected all 38 trials. Four additional variants, with those prompts unchanged, were each rejected twice.

The broad-oracle comparison accepted all six faulty screens; the hidden persistence fault was also accepted by the visible-screen judge. No production application defect was demonstrated: these faults were deliberately injected into disposable test sessions/data. The experiment exposed assertion-scope and timing defects in the test integration. These small, chosen samples do not establish a general model false-positive or flake rate.
