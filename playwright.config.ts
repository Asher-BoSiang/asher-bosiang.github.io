import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 45000, retries: 0, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4321', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'ASTRO_TELEMETRY_DISABLED=1 npm run dev -- --host 127.0.0.1 --foreground', url: 'http://127.0.0.1:4321', reuseExistingServer: !process.env.CI, timeout: 30000 },
});
