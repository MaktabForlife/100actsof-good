import path from 'node:path';
process.env.WRANGLER_LOG_PATH ||= path.resolve('.wrangler/logs');
process.env.WRANGLER_SEND_METRICS ||= 'false';
process.env.CLOUDFLARE_CF_FETCH_ENABLED ||= 'false';
