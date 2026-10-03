import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
async function scenarioStep(_name: string, action: () => Promise<void>) { await action(); }
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { ChatClient } from '../../../clients/ollama/chat-client';
import { expectChatAnswer, expectJsonError } from '../../../validators/ollama-validator';
import { unauthorizedCases } from '../test-data/unauthorized-cases';
import { model, status } from './mock-scenarios';

test.describe('POST /api/v1/ollama/chat', () => {
  let client: ChatClient;
  test.beforeEach(() => {
    // given
    client = new ChatClient();
  });

  for (const think of [false, true]) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))(`should stream the complete assistant response with thinking ${think} - 200`, async ({ account }) => {
      // given
      const payload = { model, messages: [{ role: 'user', content: status.prompt }], think };

      // when
      const response = await client.chat(payload, account.token);

      // then
      expectChatAnswer(response, { model, text: status.text, thinking: think ? status.thinking : '' });
    });
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should not reuse conversation history from a previous request - 200', async ({ account }) => {
    // given
    const previous = await client.chat({ model, messages: [{ role: 'user', content: status.prompt }] }, account.token);
    expectChatAnswer(previous, { model, text: status.text, thinking: '' });

    // when
    const response = await client.chat({ model, messages: [{ role: 'user', content: 'And what else?' }] }, account.token);

    // then
    expectChatAnswer(response, { model, thinking: '', text: [
      'Sorry, only these chat prompts are supported:',
      '- Give me a quick status update on the Ollama mock',
      '- How do I switch the backend to this mock?',
      '- What limitations should I expect from the mock?',
      '- Narrate the full streaming timeline for this mock',
    ].join('\n') });
  });

  const invalidCases = [
    { name: 'empty history', messages: [], error: { messages: 'At least one message is required' } },
    { name: 'unknown role', messages: [{ role: 'invalid', content: 'hello' }], error: { 'messages[0].role': "Role must be either 'system', 'user', 'assistant' or 'tool'" } },
    { name: 'blank message', messages: [{ role: 'user', content: ' ' }], error: { 'messages[0].contentOrThinkingOrToolCallPresent': 'Either content, thinking, or tool calls must be present' } },
    { name: 'tool result without a tool name', messages: [{ role: 'tool', content: '{}' }], error: { 'messages[0].toolNamePresentForToolRole': 'Tool messages must include tool_name' } },
  ];
  for (const { name, messages, error } of invalidCases) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))(`should reject ${name} before streaming - 400`, async ({ account }) => {
      // given
      const payload = { model, messages };

      // when
      const response = await client.chat(payload, account.token);

      // then
      expectJsonError(response, 400, error);
    });
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject a missing model and history - 400', async ({ account }) => {
    // given
    const payload = {};

    // when
    const response = await client.chat(payload, account.token);

    // then
    expectJsonError(response, 400, { model: 'must not be blank', messages: 'At least one message is required' });
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))('should reject unauthorized chat - 401', async ({ account }) => {
    // given
    const payload = { model, messages: [{ role: 'user', content: status.prompt }] };
    for (const { name, token, message } of unauthorizedCases(account.token)) {
      await scenarioStep(name, async () => {
        // when
        const response = await client.chat(payload, token);

        // then
        expectJsonError(response, 401, { message });
      });
    }
  });
});
