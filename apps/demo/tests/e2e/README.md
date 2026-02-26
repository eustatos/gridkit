# GridKit DevTools E2E Tests

This directory contains end-to-end tests for the GridKit DevTools browser extension using Playwright.

## Test Structure

```
tests/e2e/
├── extension/              # Extension-specific tests
│   ├── extension-core.test.ts      # Core extension functionality
│   ├── devtools-panel.test.ts      # DevTools panel interactions
│   └── performance.test.ts         # Performance benchmarks
├── helpers/                # Test helpers and utilities
│   ├── extension-helper.ts         # Extension interaction helpers
│   └── types.ts                    # TypeScript type definitions
├── extension.test.ts       # Basic extension tests
└── [other demo tests]
```

## Test Categories

### 1. Extension Core Tests (`extension/extension-core.test.ts`)
Tests for the extension's core functionality:
- Content script injection verification
- Content script API availability
- Table structure inspection
- Cell highlighting on hover
- Table interaction capture
- Communication with background script

### 2. DevTools Panel Tests (`extension/devtools-panel.test.ts`)
Tests for the DevTools panel UI:
- Panel opening and loading
- Table information display
- Table selection functionality
- Column statistics display
- Data export functionality (CSV)
- Panel UI interactions

### 3. Performance Tests (`extension/performance.test.ts`)
Tests for extension performance:
- Page load performance impact (<30% overhead)
- Large table handling (1000+ rows, <100ms inspection)
- Memory leak detection during rapid interactions
- Interaction handling performance

### 4. Helper Module (`helpers/`)
Utilities for testing:
- `getExtensionId()`: Get extension ID from chrome://extensions/
- `openExtensionPopup()`: Open extension popup page
- `sendMessageToExtension()`: Send message to background script
- `hasContentScript()`: Check if content script is injected
- `getContentScriptData()`: Get data from content script
- `waitForContentScript()`: Wait for content script initialization
- `getDetectedTables()`: Get detected GridKit tables
- And more...

### 5. Type Definitions (`helpers/types.ts`)
TypeScript interfaces:
- `TableInspectionResult`: Structure for table inspection results
- `ExtensionPanelData`: Data structure for extension panel
- `PerformanceMetrics`: Performance metrics structure
- `LoggedEvent`: Event logged by the extension
- `TableStateSnapshot`: Table state snapshot
- And more...

## Running Tests

### All Tests
```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI mode
pnpm test:e2e:ui

# Run in headed mode
pnpm test:e2e:headed
```

### Extension-Specific Tests
```bash
# Run only extension tests
pnpm test:e2e:extension

# Run extension tests with UI
pnpm test:e2e:extension:ui

# Run extension tests in debug mode
pnpm test:e2e:extension:debug

# Run extension tests in headed mode
pnpm test:e2e:extension:headed
```

### Individual Test Files
```bash
# Run core extension tests
pnpm test:e2e -- tests/e2e/extension/extension-core.test.ts

# Run panel tests
pnpm test:e2e -- tests/e2e/extension/devtools-panel.test.ts

# Run performance tests
pnpm test:e2e -- tests/e2e/extension/performance.test.ts
```

## Test Configuration

The tests use the following configuration:

- **Browser**: Chrome (required for extension support)
- **Mode**: Headless and headed modes supported
- **Test Environment**: Playwright with extension-loaded context

## Helper Functions

### Extension ID Management
```typescript
import { getExtensionId } from './helpers/extension-helper';

// Get extension ID from chrome://extensions/
const extensionId = await getExtensionId(page);
```

### Content Script Detection
```typescript
import { hasContentScript, waitForContentScript } from './helpers/extension-helper';

// Check if content script is injected
const isInjected = await hasContentScript(page);

// Wait for content script to be ready
await waitForContentScript(page);
```

### Table Detection
```typescript
import { getDetectedTables } from './helpers/extension-helper';

// Get detected GridKit tables
const tables = await getDetectedTables(page);
```

### Extension API Access
```typescript
import { getExtensionAPI } from './helpers/extension-helper';

// Get extension API from window object
const api = await getExtensionAPI(page);

// Use API methods
const tables = api.detectTables();
const isConnected = api.isConnected();
```

### User Interaction Simulation
```typescript
import { simulateUserInteraction } from './helpers/extension-helper';

// Simulate user interactions
await simulateUserInteraction(page, element, 'click');
await simulateUserInteraction(page, element, 'hover');
await simulateUserInteraction(page, element, 'scroll');
```

## Writing New Tests

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';
import {
  getExtensionId,
  hasContentScript,
  waitForContentScript,
} from './helpers/extension-helper';

let extensionId: string;

test.describe('Feature Name', () => {
  test.beforeAll(async ({ browser }) => {
    // Setup extension ID
    const context = await browser.newContext();
    const page = await context.newPage();
    extensionId = await getExtensionId(page);
    await page.close();
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Navigate and wait for extension
    await page.goto('/');
    await waitForContentScript(page);
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    expect(await hasContentScript(page)).toBe(true);
  });
});
```

### Testing Content Script API
```typescript
test('should expose content script API', async ({ page }) => {
  const api = await getExtensionAPI(page);
  
  expect(api).toBeDefined();
  expect(api).toHaveProperty('isConnected');
  expect(api).toHaveProperty('detectTables');
});
```

### Testing Performance
```typescript
test('should have minimal performance impact', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  
  const endTime = Date.now();
  const loadTime = endTime - startTime;
  
  expect(loadTime).toBeLessThan(3000); // < 3 seconds
});
```

## Best Practices

1. **Isolation**: Each test should have a clean state
2. **Wait for Extension**: Always wait for content script before testing
3. **Error Handling**: Handle cases where extension might not be loaded
4. **Performance Checks**: Monitor memory usage and performance impact
5. **Type Safety**: Use TypeScript interfaces from `helpers/types.ts`
6. **Documentation**: Add comments explaining complex test logic
7. **Artifacts**: Use Playwright's built-in screenshot/video recording

## Troubleshooting

### Extension Not Found
- Make sure the extension is loaded in Chrome
- Check that the extension path is correct in `playwright.config.ts`
- Verify extension ID extraction is working

### Content Script Not Injected
- Check browser console for errors
- Verify content script is registered in `manifest.json`
- Ensure the page URL matches content script matches

### Tests Failing
- Run tests in headed mode to see browser actions
- Check test logs for detailed error messages
- Verify the demo app is running (`pnpm dev`)

## CI/CD Integration

The tests are ready for CI/CD integration:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [pull_request, push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test:e2e
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [GridKit DevTools](../../packages/devtools/README.md)
