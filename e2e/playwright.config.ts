import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  globalSetup: './globalSetup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'Strictly Structured', use: { ...devices['Desktop Chrome'] } }],
  timeout: 30_000,
});
