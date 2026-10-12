import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    browserName: 'chromium',
    channel: 'msedge',
    headless: true,
  },
});