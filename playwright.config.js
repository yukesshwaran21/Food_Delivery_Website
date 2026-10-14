import { defineConfig } from "@playwright/test";
import frontendConfig from "./frontend/playwright.config.js";

export default defineConfig({
  ...frontendConfig,
  testDir: "./frontend/tests",
  webServer: {
    ...frontendConfig.webServer,
    cwd: "./frontend",
  },
});
