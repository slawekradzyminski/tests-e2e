
import { expect } from 'e2e';
import type { UserRegisterDto } from '../types/auth';

/** Exact public fields also guard against accidental credential exposure. */
export function expectRegisteredUser(body: unknown, user: UserRegisterDto): void {
  expect(body).toEqual({
    id: expect.any(Number),
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: ['ROLE_CLIENT'],
  });
  const { id } = body as { id: number };
  expect(Number.isInteger(id)).toBe(true);
  expect(id).toBeGreaterThan(0);
}
