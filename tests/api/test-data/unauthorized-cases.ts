
/** A real token is needed to preserve the JWT header and payload when tampering. */
export function unauthorizedCases(validToken: string) {
  return [
    { name: 'missing token', token: undefined, message: 'Unauthorized' },
    { name: 'empty token', token: '', message: 'Unauthorized' },
    { name: 'malformed token', token: 'invalid', message: 'Invalid or expired token' },
    {
      name: 'tampered token',
      token: `${validToken.slice(0, validToken.lastIndexOf('.') + 1)}AAAA`,
      message: 'Invalid or expired token',
    },
  ] as const;
}
