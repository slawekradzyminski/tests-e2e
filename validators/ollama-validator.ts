
import { expect } from 'e2e';
import type { StreamResponse } from '../clients/ollama/sse-response';

export function expectCompletedStream(response: StreamResponse, model: string, kind: 'generate' | 'chat') {
  expect(response.status, response.body).toBe(200);
  expect(response.contentType).toMatch(/^text\/event-stream(?:;|$)/);
  expect(response.events.length).toBeGreaterThan(2);
  expect(response.events.at(-1)?.done, 'Final event completes the response').toBe(true);
  expect(response.eventReads.at(-1), 'Content arrives in a read before the final event').toBeGreaterThan(response.eventReads[0]);
  for (const event of response.events) {
    expect(event.model).toBe(model);
    expect(typeof event.done).toBe('boolean');
    expect(typeof event.created_at).toBe('string');
    expect(Number.isFinite(Date.parse(event.created_at))).toBe(true);
    if (kind === 'generate') {
      expect(event.response === null || typeof event.response === 'string').toBe(true);
      expect(event.thinking === null || typeof event.thinking === 'string').toBe(true);
    } else if (event.message !== null) {
      expect(event.message?.role).toMatch(/^(assistant|tool)$/);
      expect(event.message?.content === null || typeof event.message?.content === 'string').toBe(true);
    }
  }
}

export function expectThinkingBeforeAnswer(response: StreamResponse, kind: 'generate' | 'chat') {
  const thoughts = response.events.map(event => kind === 'generate' ? event.thinking : event.message?.thinking);
  const answers = response.events.map(event => kind === 'generate' ? event.response : event.message?.content);
  const lastThought = thoughts.reduce((last, value, index) => value ? index : last, -1);
  expect(lastThought, 'Thinking is present').toBeGreaterThanOrEqual(0);
  expect(answers.findIndex(value => !!value), 'Answer follows all thinking chunks').toBeGreaterThan(lastThought);
}

export function expectJsonError(response: StreamResponse, status: number, body: object) {
  expect(response.status, response.body).toBe(status);
  expect(response.contentType).toMatch(/^application\/json(?:;|$)/);
  expect(response.events).toEqual([]);
  expect(JSON.parse(response.body)).toEqual(body);
}

interface ExpectedAnswer {
  model: string;
  text: string;
  thinking: string;
}

export function expectGeneratedAnswer(response: StreamResponse, expected: ExpectedAnswer) {
  expectCompletedStream(response, expected.model, 'generate');
  expect(response.events.slice(0, -1).every(event => !event.done), 'Generation completes only after all chunks').toBe(true);
  expect(response.events.map(event => event.response ?? '').join(''), 'Complete generated answer').toBe(expected.text);
  expectThinking(response, expected.thinking, 'generate');
}

export function expectChatAnswer(response: StreamResponse, expected: ExpectedAnswer) {
  expectCompletedStream(response, expected.model, 'chat');
  expect(response.events.slice(0, -1).every(event => !event.done && event.message?.role === 'assistant'), 'Assistant streams until the final completion event').toBe(true);
  expect(response.events.map(event => event.message?.content ?? '').join(''), 'Complete assistant answer').toBe(expected.text);
  expectThinking(response, expected.thinking, 'chat');
}

function expectThinking(response: StreamResponse, expected: string, kind: 'generate' | 'chat') {
  const thinking = response.events.map(event => (kind === 'generate' ? event.thinking : event.message?.thinking) ?? '').join('');
  expect(thinking, 'Requested thinking content').toBe(expected);
  if (expected) expectThinkingBeforeAnswer(response, kind);
}

export function expectNoChatThinking(response: StreamResponse) {
  expectThinking(response, '', 'chat');
}
