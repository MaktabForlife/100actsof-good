import './env.mjs';
import {execFileSync, spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';

const mode = process.argv[2] || 'all';
if (!['build', 'deploy', 'all'].includes(mode)) throw new Error('Use build, deploy, or all.');
const branch = process.env.WORKERS_CI_BRANCH || execFileSync('git', ['branch', '--show-current'], {encoding:'utf8'}).trim();
if (branch !== 'dev') throw new Error('Publishing is restricted to the dev branch. Production deployments are paused.');
const source = JSON.parse(readFileSync('wrangler.preview.jsonc', 'utf8'));
const expectedAccount = '7f42bd46597bab9181b7a128a695f2cd';
const expectedDatabase = 'd729bd01-d7c2-40dc-bdd0-4f14fa5b49c6';
if (source.account_id !== expectedAccount || source.d1_databases?.length !== 1 || source.d1_databases[0].database_id !== expectedDatabase || source.routes.length) {
  throw new Error('Preview account, database, or routes do not match the approved test environment.');
}
const env = {...process.env, CLOUDFLARE_ACCOUNT_ID:expectedAccount, WRANGLER_SEND_METRICS:'false'};
function run(program, args) {
  const r = spawnSync(program, args, {stdio:'inherit', env});
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status ?? 1);
}
if (mode !== 'deploy') {
  run('node', ['node_modules/typescript/bin/tsc', '--noEmit']);
  run('node', ['node_modules/vinext/dist/cli.js', 'build']);
  // Preserve the framework's compiled entry and assets while replacing all
  // production resources. The newer Preview CLI is separate from the pinned
  // build toolchain so publishing does not change the application dependencies.
  const built = JSON.parse(readFileSync('dist/server/wrangler.json', 'utf8'));
  const config = {
    ...built,
    routes:[],
    workers_dev:false,
    preview_urls:true,
    d1_databases:source.d1_databases,
    previews:{d1_databases:source.d1_databases, vars:{APP_ENV:'preview'}},
  };
  delete config.configPath;
  delete config.userConfigPath;
  delete config.legacy_env;
  writeFileSync('dist/server/wrangler.preview.json', JSON.stringify(config, null, 2)+'\n');
  console.log('Built the dev Preview with its isolated D1 database and no production routes.');
}
if (mode !== 'build') {
  const config = JSON.parse(readFileSync('dist/server/wrangler.preview.json', 'utf8'));
  if (config.account_id !== expectedAccount || config.previews?.d1_databases?.[0]?.database_id !== expectedDatabase || config.routes?.length) {
    throw new Error('Build the isolated Preview configuration before publishing.');
  }
  run('node', ['node_modules/wrangler/bin/wrangler.js', 'd1', 'migrations', 'apply', 'DB', '--remote', '--config', 'wrangler.preview.jsonc']);
  run('npx', ['--yes', 'wrangler@4.135.0', 'preview', '--name', 'dev', '--config', 'dist/server/wrangler.preview.json']);
}
