
import { expect } from 'e2e';
import type { StreamResponse } from '../clients/ollama/sse-response';

type ExpectedToolCall = { name: string; arguments: Record<string, unknown> };

export function expectToolCallsInOrder(response: StreamResponse, expected: ExpectedToolCall[]) {
  const calls = response.events.flatMap(event => event.message?.tool_calls ?? []);
  expect(calls.map(call => call.function), 'Tool names and arguments').toEqual(expected);

  const exchange = response.events.flatMap(({ message }) => {
    if (message?.role === 'tool') return [`result:${message.tool_name}`];
    return (message?.tool_calls ?? []).map(call => `call:${call.function.name}`);
  });
  const expectedExchange = expected.flatMap(tool => [`call:${tool.name}`, `result:${tool.name}`]);
  expect(exchange, 'Each tool returns its result before the next tool is called').toEqual(expectedExchange);
}

export function expectToolResult(response: StreamResponse, toolName: string, expected: unknown) {
  const results = response.events.filter(event => event.message?.role === 'tool' && event.message.tool_name === toolName);
  expect(results, `One result for ${toolName}`).toHaveLength(1);
  const content = results[0].message?.content;
  expect(typeof content, `${toolName} returns JSON text`).toBe('string');
  expect(JSON.parse(content ?? ''), `${toolName} result`).toEqual(expected);
}

export function expectAssistantAnswerAfterTools(response: StreamResponse, expected: string) {
  const firstAnswer = response.events.findIndex(event => event.message?.role === 'assistant' && !!event.message.content);
  const lastToolResult = response.events.reduce((last, event, index) => event.message?.role === 'tool' ? index : last, -1);
  expect(lastToolResult, 'At least one tool result is present').toBeGreaterThanOrEqual(0);
  expect(firstAnswer, 'Assistant answers after receiving all tool results').toBeGreaterThan(lastToolResult);

  const answer = response.events
    .filter(event => event.message?.role === 'assistant')
    .map(event => event.message?.content ?? '')
    .join('');
  expect(answer, 'Complete assistant answer').toBe(expected);
}
