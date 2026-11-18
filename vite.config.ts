import vinext from 'vinext';
import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
export default defineConfig(({command})=>({
  server: { host: '127.0.0.1', watch: { useFsEvents: false, usePolling: true } },
  plugins: [vinext(), cloudflare({ viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] }, inspectorPort: false,
    // The pinned local workerd binary predates the production compatibility date.
    ...(command==='serve'?{config:{compatibility_date:'2026-05-22'}}:{}),
  })],
}));
