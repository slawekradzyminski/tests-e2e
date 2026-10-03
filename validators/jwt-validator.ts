
import { expect } from 'e2e';

function decodeSegment(segment: string, label: string): Buffer {
  expect(segment, `${label} must be unpadded base64url`).toMatch(/^[A-Za-z0-9_-]+$/);
  const decoded = Buffer.from(segment, 'base64url');
  expect(decoded.toString('base64url'), `${label} must use canonical base64url`).toBe(segment);
  return decoded;
}

function decodeObject(segment: string, label: string): Record<string, unknown> {
  const bytes = decodeSegment(segment, label);
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new Error(`${label} must contain a valid UTF-8 JSON object`);
  }
  expect(value !== null && typeof value === 'object' && !Array.isArray(value),
    `${label} must be a JSON object`).toBe(true);
  return value as Record<string, unknown>;
}

/** Checks this API's JWT structure and claims, not its cryptographic signature. */
export function expectLoginJwt(token: unknown, username: string, roles: readonly string[]): void {
  expect(typeof token, 'JWT must be a string').toBe('string');
  const segments = (token as string).split('.');
  expect(segments.length, 'JWT must have header, payload and signature').toBe(3);
  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  const header = decodeObject(encodedHeader, 'JWT header');
  const payload = decodeObject(encodedPayload, 'JWT payload');
  const signature = decodeSegment(encodedSignature, 'JWT signature');

  // The backend selects the HMAC algorithm according to its configured key size.
  expect(['HS256', 'HS384', 'HS512']).toContain(header.alg);
  const signatureLengths: Record<string, number> = { HS256: 32, HS384: 48, HS512: 64 };
  expect(signature.length, 'JWT signature length').toBe(signatureLengths[header.alg as string]);
  if (header.typ !== undefined) expect(header.typ).toBe('JWT');

  expect(payload.sub, 'JWT subject').toBe(username);
  expect(payload.auth, 'JWT authorities').toEqual(roles.map(authority => ({ authority })));
  for (const claim of ['iat', 'exp'] as const) {
    expect(typeof payload[claim], `JWT ${claim} must be numeric`).toBe('number');
    expect(Number.isFinite(payload[claim]), `JWT ${claim} must be finite`).toBe(true);
  }
  const now = Date.now() / 1000;
  expect(payload.iat as number, 'JWT issued in the future (30s clock tolerance)').toBeLessThanOrEqual(now + 30);
  expect(payload.exp as number, 'JWT must not be expired').toBeGreaterThan(now);
  expect(payload.exp as number, 'JWT expiry must follow issuance').toBeGreaterThan(payload.iat as number);
}
