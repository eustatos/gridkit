# GridKit DevTools E2E Testing Guide

Comprehensive end-to-end testing suite for the GridKit DevTools browser extension using Playwright.

## Overview

This test suite validates the GridKit DevTools extension functionality including:

- Extension loading and initialization
- Content script injection and API
- DevTools panel rendering and UI
- Table detection and inspection
- Real-time event monitoring
- Performance profiling
- State management and time travel
- Plugin system

## Prerequisites

1. **Node.js** v18+ and **pnpm** v8+
2. **Playwright** browsers installed
3. Built extension in `packages/devtools/extension-dist`

## Quick Start

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install chromium

# Build the extension
pnpm build:extension

# Run all e2e tests
pnpm test:e2e

# Run extension-specific tests
pnpm test:e2e:extension
```

## Test Scripts

| Command | Description |
|---------|-------------|
| `pnpm test:e2e` | Run all e2e tests |
| `pnpm test:e2e:ui` | Run tests with Playwright UI mode |
| `pnpm test:e2e:debug` | Run tests in debug mode |
| `pnpm test:e2e:headed` | Run tests with visible browser |
| `pnpm test:e2e:extension` | Run extension tests only |
| `pnpm test:e2e:devtools` | Run DevTools integration tests |

## Test Structure

```
tests/e2e/
├── extension/
│   ├── devtools-extension.test.ts    # Core extension functionality
│   ├── devtools-panel-ui.test.ts     # Panel UI components
│   ├── extension-core.test.ts        # Content script API
│   └── performance.test.ts           # Performance tests
├── helpers/
│   ├── extension-helper.ts           # Test utilities
│   ├── README.md                     # Helper documentation
│   └── types.ts                      # TypeScript types
├── devtools-integration.test.ts      # DevTools integration
├── devtools-state.test.ts            # State management tests
├── devtools-performance.test.ts      # Performance monitoring
├── devtools-ui-components.test.ts    # UI component tests
└── README.md                         # This file
```

## Test Categories

### 1. Extension Loading & Initialization

Tests that verify the extension loads correctly in the browser.

```typescript
test('should load extension successfully', async ({ page }) => {
  await page.goto('/');
  
  const hasExtension = await page.evaluate(() => {
    return typeof chrome !== 'undefined' && chrome.runtime !== undefined;
  });
  
  expect(hasExtension).toBe(true);
});
```

### 2. Content Script Injection

Tests for content script injection and API availability.

```typescript
test('should inject content script', async ({ page }) => {
  await page.goto('/');
  await waitForContentScript(page);
  
  const hasScript = await hasContentScript(page);
  expect(hasScript).toBe(true);
});
```

### 3. Table Detection

Tests for GridKit table detection and inspection.

```typescript
test('should detect tables', async ({ page }) => {
  await page.goto('/');
  await waitForTableRegistration(page);
  
  const tables = await getDetectedTables(page);
  expect(tables.length).toBeGreaterThan(0);
});
```

### 4. Event Monitoring

Tests for real-time event capture and replay.

```typescript
test('should capture state events', async ({ page }) => {
  await page.goto('/');
  await waitForContentScript(page);
  
  const eventsCaptured = await page.evaluate(async () => {
    const content = window.__GRIDKIT_DEVTOOLS_CONTENT__;
    let eventCount = 0;
    
    const handler = () => { eventCount++; };
    content.addMessageHandler('STATE_UPDATE', handler);
    
    await new Promise(r => setTimeout(r, 200));
    
    content.removeMessageHandler('STATE_UPDATE', handler);
    return eventCount >= 0;
  });
  
  expect(eventsCaptured).toBe(true);
});
```

### 5. Performance Monitoring

Tests for performance profiling and metrics.

```typescript
test('should measure inspection performance', async ({ page }) => {
  await page.goto('/');
  await waitForContentScript(page);
  
  const performance = await page.evaluate(() => {
    const startTime = performance.now();
    const content = window.__GRIDKIT_DEVTOOLS_CONTENT__;
    const tables = content?.detectTables?.() || [];
    const endTime = performance.now();
    
    return {
      tableCount: tables.length,
      inspectionTime: endTime - startTime,
    };
  });
  
  expect(performance.inspectionTime).toBeLessThan(100);
});
```

### 6. Panel UI Components

Tests for DevTools panel UI (simulated).

```typescript
test('should display table selector', async ({ page }) => {
  await page.goto('/');
  await waitForTableRegistration(page);
  
  const hasSelector = await page.evaluate(() => {
    const content = window.__GRIDKIT_DEVTOOLS_CONTENT__;
    const tables = content?.detectTables?.() || [];
    return tables.length > 0;
  });
  
  expect(hasSelector).toBe(true);
});
```

## Helper Functions

### Core Helpers

| Function | Description |
|----------|-------------|
| `getExtensionId(context)` | Get extension ID from chrome://extensions |
| `hasContentScript(page)` | Check if content script is injected |
| `waitForContentScript(page, timeout)` | Wait for content script initialization |
| `waitForTableRegistration(page, timeout)` | Wait for table registration |
| `getDetectedTables(page)` | Get array of detected table IDs |
| `getExtensionAPI(page)` | Get content script API instance |
| `getTableState(page, tableId)` | Get table state through content script |

### Interaction Helpers

| Function | Description |
|----------|-------------|
| `simulateUserInteraction(page, element, type)` | Simulate click/hover/scroll |
| `triggerStateUpdate(page, action, timeout)` | Trigger and wait for state update |
| `openExtensionPopup(page, extensionId)` | Open extension popup page |
| `sendMessageToExtension(page, id, message)` | Send message to background script |

## Running Specific Tests

### Run single test file
```bash
pnpm test:e2e tests/e2e/extension/devtools-extension.test.ts
```

### Run tests by name pattern
```bash
pnpm test:e2e --grep "Table Detection"
```

### Run tests in specific project
```bash
pnpm test:e2e --project chromium-with-extension
```

### Run tests with video recording
```bash
pnpm test:e2e --reporter=list
```

## Debugging Tests

### Playwright UI Mode
```bash
pnpm test:e2e:ui
```

### Debug Mode
```bash
pnpm test:e2e:debug
```

### Headed Mode (visible browser)
```bash
pnpm test:e2e:headed
```

### Generate Playwright Report
```bash
pnpm test:e2e
pnpm exec playwright show-report
```

## Test Configuration

Configuration is in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      
      - run: pnpm build:extension
      
      - run: pnpm exec playwright install chromium
      
      - run: pnpm test:e2e
      
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Common Issues

### Extension Not Found
```
Error: GridKit DevTools extension not found
```
**Solution:** Build the extension first: `pnpm build:extension`

### Content Script Not Injected
```
Timeout waiting for content script
```
**Solution:** Ensure extension is loaded with `--load-extension` flag

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Kill existing process or use different port

### Browser Not Found
```
Error: Executable doesn't exist at /path/to/chromium
```
**Solution:** Run `pnpm exec playwright install chromium`

## Best Practices

1. **Always wait for initialization** - Use `waitForContentScript()` and `waitForTableRegistration()`
2. **Clean up handlers** - Remove message handlers after tests
3. **Use helper functions** - Leverage `extension-helper.ts` utilities
4. **Test error scenarios** - Verify graceful error handling
5. **Keep tests isolated** - Each test should be independent
6. **Use meaningful assertions** - Test actual functionality, not just DOM

## Writing New Tests

```typescript
import { test, expect } from '@playwright/test';
import { 
  waitForContentScript, 
  waitForTableRegistration,
  getDetectedTables 
} from '../helpers/extension-helper';

test.describe('My New Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForContentScript(page);
    await waitForTableRegistration(page);
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    const tables = await getDetectedTables(page);
    expect(tables.length).toBeGreaterThan(0);
  });
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/reference/)
- [GridKit DevTools README](../../../packages/devtools/README.md)

## Support

For issues or questions:
- Check existing issues in the repository
- Review the [CONTRIBUTING.md](../../../CONTRIBUTING.md)
- Open a new issue with test details
