import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { spawn } from 'node:child_process';
// Read only a literal assignment; never execute the shell profile or log its value.
if (!process.env.ANTHROPIC_API_KEY) {
  const profile = readFileSync(`${homedir()}/.zshrc`, 'utf8');
  const match = profile.match(/^\s*(?:export\s+)?ANTHROPIC_API_KEY\s*=\s*(?:"([^"\r\n]+)"|'([^'\r\n]+)'|([^\s#]+))/m);
  if (!match) throw new Error('No literal ANTHROPIC_API_KEY assignment found in ~/.zshrc');
  process.env.ANTHROPIC_API_KEY = match[1] ?? match[2] ?? match[3];
}
const child = spawn(process.argv[2], process.argv.slice(3), { stdio: 'inherit', env: process.env });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => process.exit(code ?? 1));
