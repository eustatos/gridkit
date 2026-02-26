import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Get extension path - prefer extension-dist (built) if exists, otherwise use source
// Go up 2 levels from apps/demo to reach the root, then into packages/devtools
const projectRoot = path.resolve(__dirname, '../../');
const devtoolsPath = path.resolve(projectRoot, 'packages/devtools');
const builtExtensionPath = path.resolve(devtoolsPath, 'extension-dist');
const distExtensionPath = path.resolve(devtoolsPath, 'dist/extension');
const sourceExtensionPath = path.resolve(devtoolsPath, 'extension');

// Check if built extension exists (extension-dist is the webpack output)
const extensionPath = fs.existsSync(builtExtensionPath) 
  ? builtExtensionPath 
  : (fs.existsSync(distExtensionPath) ? distExtensionPath : sourceExtensionPath);

console.log('[Playwright Config] Using extension path:', extensionPath);
console.log('[Playwright Config] Built path exists:', fs.existsSync(builtExtensionPath));
console.log('[Playwright Config] Dist path exists:', fs.existsSync(distExtensionPath));
console.log('[Playwright Config] Source path exists:', fs.existsSync(sourceExtensionPath));

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Launch browser with extension loaded
    launchOptions: {
      args: [
        `--load-extension=${extensionPath}`,
        '--disable-extensions-except=' + extensionPath,
        '--enable-chrome-browser-cloud-management',
      ],
    },
  },

  projects: [
    {
      name: 'chromium-with-extension',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
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
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
