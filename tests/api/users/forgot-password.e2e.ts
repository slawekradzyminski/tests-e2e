import { test as runner } from '@e2e-dev/web';
import { HttpClient } from '../../../support/http';
import { requestFixture, selectFixtures } from '../../../support/fixtures';
const test = runner.extend<{ request: HttpClient }>({ request: requestFixture });
import { randomUUID } from 'node:crypto';
import { expect } from 'e2e';
import { fixtures as testFixtures, dependencies as testDependencies } from '../../../fixtures/shared/account';
import { ForgotPasswordClient } from '../../../clients/users/forgot-password-client';
import { GetEmailEventsClient } from '../../../clients/users/get-email-events-client';
import type { EmailEventDto } from '../../../types/account';

test.describe('POST /api/v1/users/password/forgot', () => {
  let client: ForgotPasswordClient;
  let eventsClient: GetEmailEventsClient;

  test.beforeEach(async ({ request }) => {
    // given
    client = new ForgotPasswordClient(request);
    eventsClient = new GetEmailEventsClient(request);
  });

  for (const field of ['username', 'email'] as const) {
    test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, ["account"]))(`should accept a reset request by ${field} and record its email event - 202`, async ({ account }) => {
      // given
      const identifier = account.user[field];

      // when
      const response = await client.requestReset({ identifier });

      // then
      expect(response.status()).toBe(202);
      expect(await response.json()).toMatchObject({
        message: 'If the account exists, password reset instructions have been sent.',
        token: expect.stringMatching(/\S+/),
      });
      const eventsResponse = await eventsClient.get(account.token);
      expect(eventsResponse.status()).toBe(200);
      const events: EmailEventDto[] = await eventsResponse.json();
      const resetEvent = events.find((event) => event.type === 'PASSWORD_RESET_REQUESTED');
      expect(resetEvent).toBeDefined();
      expect(['QUEUED', 'SENT_TO_SMTP_SINK']).toContain(resetEvent?.status);
    });
  }

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, []))('should accept an unknown identifier with the generic message and no usable token - 202', async () => {
    // given
    const identifier = `unknown-${randomUUID()}@example.com`;

    // when
    const response = await client.requestReset({ identifier });

    // then
    expect(response.status()).toBe(202);
    const body = await response.json();
    expect(body.message).toBe('If the account exists, password reset instructions have been sent.');
    expect(body.token ?? null).toBeNull();
  });

  test.extend<Record<string, any>>(selectFixtures(testFixtures, testDependencies, []))('should reject an empty identifier - 400', async () => {
    // given
    const payload = { identifier: '' };

    // when
    const response = await client.requestReset(payload);

    // then
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ identifier: 'Identifier is required' });
  });
});
