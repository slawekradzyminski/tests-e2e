import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { ToolDefinitionsClient } from '../../../clients/ollama/tool-definitions-client';
import { expectCatalogToolDefinitions, expectToolDefinitionsUnauthorized } from '../../../validators/ollama-definitions-validator';
import { unauthorizedCases } from '../test-data/unauthorized-cases';

test.describe('GET /api/v1/ollama/chat/tools/definitions', () => {
  let client: ToolDefinitionsClient;
  test.beforeEach(({ request }) => {
    // given
    client = new ToolDefinitionsClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should describe both supported catalog functions and their arguments - 200', async ({ account }) => {
    // given
    const token = account.token;

    // when
    const response = await client.get(token);

    // then
    await expectCatalogToolDefinitions(response);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject unauthorized access to tool definitions - 401', async ({ account }) => {
    // given
    for (const { name, token, message } of unauthorizedCases(account.token)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.get(token);

        // then
        await expectToolDefinitionsUnauthorized(response, message);
      });
    }
  });
});
