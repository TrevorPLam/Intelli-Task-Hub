import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ['html', { outputFolder: './playwright-report' }],
    ['json', { outputFile: './test-results.json' }],
    ['junit', { outputFile: './test-results.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  webServer: {
    command: 'npm run serve:test',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Performance monitoring configuration
  expect: {
    timeout: 10000,
  },

  // Global setup for performance monitoring
  globalSetup: './src/__tests__/playwright/global-setup.ts',
  globalTeardown: './src/__tests__/playwright/global-teardown.ts',
});
