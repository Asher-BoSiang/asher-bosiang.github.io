import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 90000, retries: 0, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4321', viewport: { width: 1100, height: 700 }, launchOptions: { args: process.env.CI ? ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] : [] }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: process.env.CI ? 'npm run preview -- --host 127.0.0.1 --port 4321' : 'ASTRO_TELEMETRY_DISABLED=1 npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:4321', reuseExistingServer: !process.env.CI, timeout: 30000 },
});
