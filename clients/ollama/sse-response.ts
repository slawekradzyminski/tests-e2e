
import { APP_BASE_URL } from '../../test-config';
import type { OllamaEvent } from '../../types/ollama';

export interface StreamResponse {
  status: number;
  contentType: string;
  events: OllamaEvent[];
  eventReads: number[];
  body: string;
}

/** Playwright buffers APIResponse; fetch lets us observe events as bytes arrive. */
export async function postSse(path: string, data: unknown, token?: string): Promise<StreamResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error(`SSE deadline exceeded: ${path}`)), 20_000);
  try {
    const response = await fetch(`${APP_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream, application/json',
        ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    const result: StreamResponse = {
      status: response.status,
      contentType: response.headers.get('content-type') ?? '',
      events: [], eventReads: [], body: '',
    };
    if (!response.body) throw new Error('Response has no readable body');
    const isSse = result.contentType.startsWith('text/event-stream');
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let pending = '';
    let bytes = 0;
    let read = 0;
    for await (const chunk of response.body) {
      if ((bytes += chunk.length) > 1_000_000) throw new Error('Response exceeds 1 MB safety bound');
      read++;
      const text = decoder.decode(chunk, { stream: true });
      if (!isSse) { result.body += text; continue; }
      pending += text;
      let boundary: RegExpExecArray | null;
      while ((boundary = /\r?\n\r?\n/.exec(pending))) {
        const frame = pending.slice(0, boundary.index);
        pending = pending.slice(boundary.index + boundary[0].length);
        const lines = frame.split(/\r?\n/).filter(line => line === 'data' || line.startsWith('data:'));
        if (!lines.length) continue; // SSE comments/keepalives are not data events.
        const payload = lines.map(line => line.slice(5).replace(/^ /, '')).join('\n');
        result.events.push(JSON.parse(payload));
        result.eventReads.push(read);
      }
    }
    const tail = decoder.decode();
    if (isSse) {
      if ((pending + tail).trim()) throw new Error('Stream ended with an unterminated SSE frame');
    } else result.body += tail;
    return result;
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}
