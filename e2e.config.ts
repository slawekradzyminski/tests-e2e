import type { E2EConfig } from 'e2e';
import { formPassword } from './support/passwords';
import { web } from '@e2e-dev/web';
import { anthropic } from '@ai-sdk/anthropic';
import { APP_BASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD } from './test-config';

export default {
  tests: 'tests/**/*.e2e.ts',
  targets: [{ name: 'chromium', engine: web({ viewport: { width: 1920, height: 1080 } }), app: { url: APP_BASE_URL, environment: 'test' } }],
  workers: 2,
  timeout: 120_000,
  cleanupTimeout: 30_000,
  reporters: ['list', 'markdown'],
  agents: { default: {
    model: anthropic(process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5-5'),
    maxModelCalls: 12,
    maxSteps: 20,
    context: 'Training shop. Test only the isolated data supplied in parameters. Never change shared admin credentials or unrelated products/users.',
  } },
  credentials: { admin: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD } },
  secrets: { 'form-password': formPassword },
} satisfies E2EConfig;
