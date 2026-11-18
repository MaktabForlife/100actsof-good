import './env.mjs';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
const expectedAccount = '7f42bd46597bab9181b7a128a695f2cd';
const expectedDatabase = '35e77ced-b8c0-4fdd-bbb7-3c52d5a0e720';
if (config.account_id !== expectedAccount || config.d1_databases?.[0]?.database_id !== expectedDatabase) {
  throw new Error('Deployment stopped: account or database differs from the approved production configuration.');
}
const env = { ...process.env, CLOUDFLARE_ACCOUNT_ID: expectedAccount, WRANGLER_SEND_METRICS: 'false' };
for (const [program, ...args] of [
  ['node', 'node_modules/typescript/bin/tsc', '--noEmit'],
  ['node', '--experimental-strip-types', '--test', 'tests/security.test.ts'],
  ['node', 'node_modules/wrangler/bin/wrangler.js', 'd1', 'migrations', 'apply', 'DB', '--remote', '--config', 'wrangler.jsonc'],
  ['node', 'node_modules/vinext/dist/cli.js', 'build'],
  ['node', 'node_modules/wrangler/bin/wrangler.js', 'deploy', '--config', 'dist/server/wrangler.json'],
]) {
  const r = spawnSync(program, args, { stdio: 'inherit', env });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status ?? 1);
}
