import { defineConfig, devices } from '@playwright/test'

// End-to-end tests of every website workflow, in a real browser.
//   npm run build && npm run test:e2e
// They run against the built site (vite preview), like visitors use it.
// Master sample files: e2e/fixtures (never changed; checked by e2e/global-setup.ts).
// Downloaded files: each test's own folder in test-results/, deleted when the test passes.
// Results also go to test-results/e2e.xml for the quality gate (quality-gate.yml).
const PORT = 4173

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  outputDir: 'test-results/e2e-artifacts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // a retry would hide a flaky test from the gate
  reporter: [['list'], ['junit', { outputFile: 'test-results/e2e.xml' }]],
  use: {
    baseURL: `http://localhost:${PORT}/`,
    acceptDownloads: true,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /pwa\.spec\.ts/ },
    // The desktop app (PWA) tests run after the others, on their own: one of them
    // publishes a "new version" by changing the built service worker for a moment.
    { name: 'pwa', use: { ...devices['Desktop Chrome'] }, testMatch: /pwa\.spec\.ts/, dependencies: ['chromium'], fullyParallel: false },
  ],
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
