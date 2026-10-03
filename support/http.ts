/** Small fetch transport shared by endpoint-specific clients; no test runner dependency. */
export interface RequestOptions {
  data?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
}
export class HttpResponse {
  constructor(private readonly response: Response, private readonly bytes: Buffer) {}
  status() { return this.response.status; }
  ok() { return this.response.ok; }
  headers() { return Object.fromEntries(this.response.headers); }
  async json(): Promise<any> { return JSON.parse(this.bytes.toString('utf8')); }
  async text() { return this.bytes.toString('utf8'); }
  async body() { return this.bytes; }
}
export class HttpClient {
  async send(method: string, address: string, options: RequestOptions = {}) {
    const url = new URL(address);
    for (const [key, value] of Object.entries(options.params ?? {})) url.searchParams.set(key, String(value));
    const response = await fetch(url, {
      method,
      headers: { ...(options.data === undefined ? {} : { 'Content-Type': 'application/json' }), ...options.headers },
      ...(options.data === undefined ? {} : { body: JSON.stringify(options.data) }),
      signal: AbortSignal.timeout(30_000),
    });
    return new HttpResponse(response, Buffer.from(await response.arrayBuffer()));
  }
  get(url: string, options?: RequestOptions) { return this.send('GET', url, options); }
  post(url: string, options?: RequestOptions) { return this.send('POST', url, options); }
  put(url: string, options?: RequestOptions) { return this.send('PUT', url, options); }
  delete(url: string, options?: RequestOptions) { return this.send('DELETE', url, options); }
}
