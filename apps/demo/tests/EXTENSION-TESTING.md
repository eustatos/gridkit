# Testing GridKit DevTools Extension with Playwright

This guide explains how to test the GridKit DevTools Chrome extension using Playwright.

## Prerequisites

- Node.js and pnpm installed
- Chrome browser (for extension support)

## Setup

### 1. Build the Extension

First, build the extension before testing:

```bash
cd packages/devtools
pnpm build:extension
```

This compiles the TypeScript files and outputs them to `packages/devtools/dist/`.

### 2. Update Playwright Config

The Playwright config (`playwright.config.ts`) is already configured with extension support:

```typescript
// Get extension path relative to config file
const extensionPath = path.resolve(
  __dirname,
  '../packages/devtools/extension'
);

export default defineConfig({
  use: {
    launchOptions: {
      args: [
        `--load-extension=${extensionPath}`,
        '--disable-extensions-except=' + extensionPath,
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
  ],
});
```

## Running Extension Tests

### Option 1: Use the helper script

```bash
./apps/demo/scripts/test-extension.sh
```

### Option 2: Manual command

```bash
# Build extension
pnpm build:extension

# Run extension-specific tests
npx playwright test tests/e2e/extension.test.ts --project=chromium-with-extension

# Run all tests
npx playwright test --project=chromium-with-extension
```

### Option 3: Run with VS Code

Open the test file in VS Code and click the debug button (if you have Playwright extension installed).

## Test Categories

### 1. Extension Loading Tests (`extension.test.ts`)

Tests verify that the extension loads correctly with the page:

```typescript
test('should load the extension with the page', async ({ page }) => {
  await expect(page.locator('h1')).toContainText('GridKit DevTools Demo');
});
```

### 2. Extension Integration Tests

Tests verify the extension can interact with the web page:

```typescript
test('should allow extension to inspect table state', async ({ page }) => {
  const tableState = await page.evaluate(() => {
    const table = document.querySelector('table');
    return {
      row_count: table.querySelectorAll('tbody tr').length,
      column_count: table.querySelectorAll('thead th').length,
    };
  });
  
  expect(tableState.row_count).toBeGreaterThan(0);
});
```

## Advanced Testing Patterns

### Testing Extension Background Scripts

```typescript
test('should test extension background functionality', async ({ browser }) => {
  const context = await browser.newContext();
  
  // Extension should be loaded automatically via launchOptions
  // Test background script functionality
  const page = await context.newPage();
  
  // Your test logic here
});
```

### Testing Content Scripts

```typescript
test('should verify content script injection', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Check if content script injected required objects
  const isInjected = await page.evaluate(() => {
    return typeof window.GridKitDevToolsContentScript !== 'undefined';
  });
  
  expect(isInjected).toBe(true);
});
```

### Testing DevTools Panel

```typescript
test('should open DevTools panel', async ({ page }) => {
  // Navigate to the demo app
  await page.goto('http://localhost:3000');
  
  // Extension should have registered DevTools panel
  // Access via chrome.devtools.panels API in extension context
});
```

## Debugging Extension Tests

### 1. Run with DevTools Open

```bash
npx playwright test --project=chromium-with-extension --debug
```

### 2. Slow Down Tests

```bash
npx playwright test tests/e2e/extension.test.ts --project=chromium-with-extension --trace on
```

### 3. Take Screenshots

```bash
npx playwright test tests/e2e/extension.test.ts --project=chromium-with-extension --screenshot on
```

## Troubleshooting

### Extension Not Loading

1. Verify extension files exist: `ls packages/devtools/extension/`
2. Check build output: `ls packages/devtools/dist/`
3. Verify manifest.json is valid
4. Check Chrome extension permissions

### Tests Timing Out

1. Increase timeout: `test('name', async ({ page }) => { ... }, { timeout: 30000 });`
2. Use explicit waits instead of `waitForTimeout`
3. Check extension initialization time

### Extension Permissions

The extension requests:
- `activeTab`: Access current tab
- `scripting`: Inject scripts
- `<all_urls>`: Access all URLs (for content scripts)

## Best Practices

1. **Build Extension Before Tests**: Always build the extension before running tests
2. **Use Specific Projects**: Use `chromium-with-extension` project for extension tests
3. **Mock Extension API**: For unit tests, mock the extension API
4. **Test Extension Lifecycle**: Test extension install, update, and uninstall flows
5. **Cross-Browser Testing**: Test with different Chrome versions if possible

## Example: Complete Extension Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('GridKit DevTools Extension', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should load extension and show DevTools panel', async ({ page }) => {
    // Verify page loaded
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify table is ready for extension inspection
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Check extension injected required objects
    const hasExtension = await page.evaluate(() => {
      return typeof window.GridKitDevTools !== 'undefined';
    });
    
    expect(hasExtension).toBe(true);
  });

  test('should allow extension to monitor table events', async ({ page }) => {
    // Simulate user action
    const header = page.locator('thead th:has-text("Name")');
    await header.click();
    
    // Extension should track this event
    const eventLogged = await page.evaluate(() => {
      return window.GridKitDevTools?.eventLog?.length > 0;
    });
    
    expect(eventLogged).toBe(true);
  });
});
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Build extension
  run: cd packages/devtools && pnpm build:extension

- name: Run extension tests
  run: npx playwright test tests/e2e/extension.test.ts --project=chromium-with-extension
```

## Related Files

- Extension code: `packages/devtools/extension/`
- Extension tests: `apps/demo/tests/e2e/extension.test.ts`
- Playwright config: `apps/demo/playwright.config.ts`
- Extension README: `packages/devtools/extension/README.md`
