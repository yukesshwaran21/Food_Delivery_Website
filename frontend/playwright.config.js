import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [
  ["html", { open: "never" }],
  ["json", { outputFile: "test-results/results.json" }],
],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
retries: process.env.CI ? 1 : 0,

use: {
  baseURL: "http://localhost:5173",
  browserName: "chromium",
  ...(process.env.CI ? {} : { channel: "msedge" }),
  headless: true,
  trace: "on-first-retry",
  screenshot: "only-on-failure",
},
});