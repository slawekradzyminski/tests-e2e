import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { GetChatSystemPromptClient } from '../../../clients/users/get-chat-system-prompt-client';
import { UpdateChatSystemPromptClient } from '../../../clients/users/update-chat-system-prompt-client';
import { unauthorizedCases } from '../test-data/unauthorized-cases';

test.describe('GET /api/v1/users/chat-system-prompt', () => {
  let client: GetChatSystemPromptClient;
  let updateClient: UpdateChatSystemPromptClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new GetChatSystemPromptClient(request);
    updateClient = new UpdateChatSystemPromptClient(request);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should return the default prompt for a new user - 200', async ({ account }) => {
    // given
    const { token } = account;

    // when
    const response = await client.get(token);

    // then
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ chatSystemPrompt: expect.stringMatching(/\S+/) });
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
    expect(await response.json()).toEqual({ chatSystemPrompt: prompt });
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
