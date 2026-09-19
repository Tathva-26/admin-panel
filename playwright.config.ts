import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  use: { baseURL: 'http://localhost:3000', headless: true, trace: 'retain-on-failure' },
  // Start backend_v2/tests/serve-events.js against the isolated test database first.
  webServer: {
    command: 'npm run start -- --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
  },
});
