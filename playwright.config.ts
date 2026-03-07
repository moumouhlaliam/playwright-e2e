
import { defineConfig } from '@playwright/test';

const baseURL = (process.env.CONSIGNO_BASE_URL ?? 'https://cloud.consigno.com').replace(/\/+$/, '');

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL,
    headless: process.env.CI ? true : false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    
  },
  reporter: [['html', { open: 'never' }]],
  
});
