import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { UpdateChatSystemPromptClient } from '../../../clients/users/update-chat-system-prompt-client';
import { GetChatSystemPromptClient } from '../../../clients/users/get-chat-system-prompt-client';
import { unauthorizedCases } from '../test-data/unauthorized-cases';

test.describe('PUT /api/v1/users/chat-system-prompt', () => {
  let client: UpdateChatSystemPromptClient;
  let getClient: GetChatSystemPromptClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new UpdateChatSystemPromptClient(request);
    getClient = new GetChatSystemPromptClient(request);
  });

  const validCases = [
    { name: 'multiline Unicode override', prompt: 'Use supplied context.\nPreserve Unicode: zażółć 🌍' },
    { name: 'maximum length override', prompt: 'x'.repeat(5000) },
  ];

  for (const { name, prompt } of validCases) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))(`should persist ${name} - 200`, async ({ account }) => {
      // given
      const { token } = account;

      // when
      const response = await client.update(prompt, token);

      // then
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ chatSystemPrompt: prompt });
      const stored = await getClient.get(token);
      expect(stored.status()).toBe(200);
      expect(await stored.json()).toEqual({ chatSystemPrompt: prompt });
    });
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should restore the default when the override is cleared - 200', async ({ account }) => {
    // given
    const { token } = account;
    const initial = await getClient.get(token);
    expect(initial.status()).toBe(200);
    const defaultPrompt = await initial.json();
    expect((await client.update('Temporary override', token)).status()).toBe(200);

    // when
    const response = await client.update('', token);

    // then
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ chatSystemPrompt: '' });
    const restored = await getClient.get(token);
    expect(restored.status()).toBe(200);
    expect(await restored.json()).toEqual(defaultPrompt);
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject an overlong prompt without changing the stored value - 400', async ({ account }) => {
    // given
    const { token } = account;
    const prompt = 'Keep this override';
    expect((await client.update(prompt, token)).status()).toBe(200);

    // when
    const response = await client.update('x'.repeat(5001), token);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ chatSystemPrompt: 'Chat system prompt must be at most 5000 characters' });
    const stored = await getClient.get(token);
    expect(stored.status()).toBe(200);
    expect(await stored.json()).toEqual({ chatSystemPrompt: prompt });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject unauthorized requests - 401', async ({ account }) => {
    // given
    const cases = unauthorizedCases(account.token);
    const original = await getClient.get(account.token);
    expect(original.status()).toBe(200);
    const originalPrompt = await original.json();

    for (const { name, token, message } of cases) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.update('Unauthorized override', token);

        // then
        expect.soft(response.status()).toBe(401);
        expect.soft(await response.json()).toEqual({ message });
      });
    }
    const stored = await getClient.get(account.token);
    expect(stored.status()).toBe(200);
    expect(await stored.json()).toEqual(originalPrompt);
  });
});
