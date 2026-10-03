# Project conventions

- Use English and given/when/then sections with a blank line between sections.
- Use the e2e runner, native `screen`, `browser`, `agent`, and `expect` APIs. Read `.agents/skills/e2e/SKILL.md` for the changed surface.
- Keep selectors, UI actions, and assertions in page objects and composed components. Prefer stable test IDs.
- Use the local gateway at `http://localhost:8081`, with desktop Chromium at 1920 × 1080.
- API clients remain endpoint-specific. Set up and clean up only disposable test data through the API.
- e2e custom fixtures run eagerly: retain explicit per-scenario dependency selection so unrelated state-changing fixtures never run.
- Keep all 302 source scenarios represented in `evaluation/source-coverage.json`. Run `npm run verify:coverage` after coverage changes.
- Use Sonnet AI steps for selected user goals and semantic checks; retain exact UI and persisted-state assertions.
- Verify changed suites, type checking, and coverage. Reuse passing evidence for unchanged artifacts.
- Do not print keys or store them in files. The key loader reads only the Anthropic assignment from `~/.zshrc` without executing the profile.
