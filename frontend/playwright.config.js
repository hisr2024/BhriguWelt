// Playwright config for optional E2E coverage. Install @playwright/test before running.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'NEXT_PUBLIC_BACKEND_URL=http://localhost:3100 npm run dev -- --hostname 0.0.0.0 --port 3000',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
