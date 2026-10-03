import { spawn } from 'node:child_process';

const profiles = {
  deterministic: { E2E_FLOW: 'deterministic', E2E_ASSERTIONS: 'off' },
  actions: { E2E_FLOW: 'ai', E2E_ASSERTIONS: 'off' },
  judgments: { E2E_FLOW: 'deterministic', E2E_ASSERTIONS: 'on' },
};
const profile = profiles[process.argv[2]];
if (!profile) throw new Error('Choose deterministic, actions, or judgments.');
const child = spawn(process.execPath, ['scripts/with-anthropic.mjs', 'e2e', 'run', 'tests/ui', ...process.argv.slice(3)], {
  stdio: 'inherit', env: { ...process.env, ...profile },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
