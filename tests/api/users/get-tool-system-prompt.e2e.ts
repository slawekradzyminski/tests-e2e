import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { GetToolSystemPromptClient } from '../../../clients/users/get-tool-system-prompt-client';
import { UpdateToolSystemPromptClient } from '../../../clients/users/update-tool-system-prompt-client';
import { unauthorizedCases } from '../test-data/unauthorized-cases';

test.describe('GET /api/v1/users/tool-system-prompt', () => {
  let client: GetToolSystemPromptClient;
  let updateClient: UpdateToolSystemPromptClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new GetToolSystemPromptClient(request);
    updateClient = new UpdateToolSystemPromptClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should return the default prompt for a new user - 200', async ({ account }) => {
    // given
    const { token } = account;

    // when
    const response = await client.get(token);

    // then
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ toolSystemPrompt: expect.stringMatching(/\S+/) });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should return the stored override - 200', async ({ account }) => {
    // given
    const { token } = account;
    const prompt = 'Use supplied context.\nPreserve Unicode: zażółć 🌍';
    expect((await updateClient.update(prompt, token)).status()).toBe(200);

    // when
    const response = await client.get(token);

    // then
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ toolSystemPrompt: prompt });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject unauthorized requests - 401', async ({ account }) => {
    // given
    const cases = unauthorizedCases(account.token);

    for (const { name, token, message } of cases) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.get(token);

        // then
        expect.soft(response.status()).toBe(401);
        expect.soft(await response.json()).toEqual({ message });
      });
    }
  });
});
