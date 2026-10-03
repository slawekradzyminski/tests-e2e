
import { faker } from '@faker-js/faker';
import type { UserRegisterDto } from '../types/auth';

/** Select a real generated name rather than padding a short name with letters. */
function generateValidName(generate: () => string): string {
  let name: string;
  do {
    name = generate();
  } while (name.length < 4 || name.length > 255);
  return name;
}

export class UserGenerator {
  static generate(overrides: Partial<UserRegisterDto> = {}): UserRegisterDto {
    const firstName = generateValidName(() => faker.person.firstName());
    const lastName = generateValidName(() => faker.person.lastName());
    // A suffix keeps realistic account names isolated across parallel test runs.
    const username = `${faker.internet.username({ firstName, lastName })}_${faker.string.alphanumeric(12)}`;
    return {
      username,
      email: `${username.toLowerCase()}@example.com`,
      password: faker.internet.password({ length: 20 }),
      firstName,
      lastName,
      ...overrides,
    };
  }
}
