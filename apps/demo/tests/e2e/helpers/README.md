# GridKit DevTools E2E Test Helpers

This directory contains helper functions and type definitions for testing the GridKit DevTools browser extension.

## Helper Functions

### ExtensionHelper

Provides utilities for testing the extension:

#### `getExtensionId(page: Page): Promise<string>`

Get the GridKit DevTools extension ID from chrome://extensions/

```typescript
import { getExtensionId } from './extension-helper';

const extensionId = await getExtensionId(page);
console.log('Extension ID:', extensionId);
```

#### `openExtensionPopup(page: Page, extensionId: string): Promise<Page>`

Open the extension popup page in a new tab.

```typescript
import { openExtensionPopup } from './extension-helper';

const popupPage = await openExtensionPopup(page, extensionId);
// Now you can interact with the popup page
```

#### `sendMessageToExtension(page: Page, extensionId: string, message: any): Promise<any>`

Send a message to the extension's background script.

```typescript
import { sendMessageToExtension } from './extension-helper';

const response = await sendMessageToExtension(
  page, 
  extensionId, 
  { type: 'GET_TABLES' }
);
console.log('Response:', response);
```

#### `hasContentScript(page: Page): Promise<boolean>`

Check if content script is injected in the page.

```typescript
import { hasContentScript } from './extension-helper';

const isInjected = await hasContentScript(page);
if (isInjected) {
  console.log('Content script is present');
}
```

#### `getContentScriptData(page: Page, key: string): Promise<any>`

Get data from content script by key.

```typescript
import { getContentScriptData } from './extension-helper';

// Get detected tables
const tables = await getContentScriptData(page, 'tables');

// Check connection status
const connected = await getContentScriptData(page, 'connection');
```

#### `getExtensionAPI(page: Page): Promise<any>`

Get the extension API instance from window object.

```typescript
import { getExtensionAPI } from './extension-helper';

const api = await getExtensionAPI(page);
if (api) {
  const tables = api.detectTables();
  const isConnected = api.isConnected();
}
```

#### `getDetectedTables(page: Page): Promise<string[]>`

Get list of detected GridKit tables.

```typescript
import { getDetectedTables } from './extension-helper';

const tables = await getDetectedTables(page);
console.log('Detected tables:', tables);
```

#### `waitForContentScript(page: Page, timeout?: number): Promise<void>`

Wait for content script to be fully initialized.

```typescript
import { waitForContentScript } from './extension-helper';

await waitForContentScript(page); // Default timeout: 5000ms
await waitForContentScript(page, 10000); // Custom timeout
```

#### `waitForTableRegistration(page: Page, timeout?: number): Promise<void>`

Wait for tables to be registered.

```typescript
import { waitForTableRegistration } from './extension-helper';

await waitForTableRegistration(page);
```

#### `simulateUserInteraction(page: Page, element: Locator, type?: string): Promise<void>`

Simulate user interactions with elements.

```typescript
import { simulateUserInteraction } from './extension-helper';

await simulateUserInteraction(page, element, 'click');
await simulateUserInteraction(page, element, 'hover');
await simulateUserInteraction(page, element, 'scroll');
```

## Type Definitions

### TableInspectionResult

Structure for table inspection results:

```typescript
import type { TableInspectionResult } from './types';

interface TableInspectionResult {
  id: string;
  selector: string;
  type: string;
  columnCount: number;
  rowCount: number;
  columns: ColumnDefinition[];
  rowData: Record<string, any>[];
  metadata: TableMetadata;
}
```

### ColumnDefinition

Column definition from inspected table:

```typescript
import type { ColumnDefinition } from './types';

interface ColumnDefinition {
  key: string;
  header: string;
  width?: number;
  visible: boolean;
  sortable: boolean;
  filterable: boolean;
  align?: 'left' | 'center' | 'right';
}
```

### ExtensionPanelData

Data structure for extension panel:

```typescript
import type { ExtensionPanelData } from './types';

interface ExtensionPanelData {
  version: string;
  tablesCount: number;
  selectedTableId?: string;
  activeTab: 'overview' | 'columns' | 'data' | 'events' | 'performance';
  state: 'connected' | 'disconnected' | 'loading';
  lastUpdate: number;
}
```

### PerformanceMetrics

Performance metrics from the extension:

```typescript
import type { PerformanceMetrics } from './types';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  reRenderCount: number;
  avgRenderTime: number;
}
```

### LoggedEvent

Event logged by the extension:

```typescript
import type { LoggedEvent } from './types';

interface LoggedEvent {
  id: string;
  type: string;
  timestamp: number;
  source: string;
  payload: any;
  metadata?: {
    duration?: number;
    success?: boolean;
    error?: string;
  };
}
```

### TableStateSnapshot

Table state snapshot:

```typescript
import type { TableStateSnapshot } from './types';

interface TableStateSnapshot {
  tableId: string;
  pageIndex: number;
  pageSize: number;
  totalRows: number;
  filters: Record<string, any>[];
  sorting: SortingState[];
  selectedRowIds: string[];
  expandedRowIds: string[];
}
```

## Usage Examples

### Complete Test Example

```typescript
import { test, expect } from '@playwright/test';
import {
  getExtensionId,
  hasContentScript,
  waitForContentScript,
  getDetectedTables,
  getExtensionAPI,
  simulateUserInteraction,
} from './helpers/extension-helper';

let extensionId: string;

test.describe('Extension Test Suite', () => {
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

  test('should have content script', async ({ page }) => {
    expect(await hasContentScript(page)).toBe(true);
  });

  test('should detect tables', async ({ page }) => {
    const tables = await getDetectedTables(page);
    expect(tables.length).toBeGreaterThan(0);
  });

  test('should have extension API', async ({ page }) => {
    const api = await getExtensionAPI(page);
    expect(api).toBeDefined();
    expect(api.detectTables).toBeDefined();
  });

  test('should handle user interactions', async ({ page }) => {
    const header = page.locator('thead th:has-text("Name")');
    await simulateUserInteraction(page, header, 'click');
    
    // Verify interaction was processed
    const sortIndicator = header.locator('span:text("↑")');
    expect(sortIndicator).toBeDefined();
  });
});
```

### Error Handling

```typescript
import { test, expect } from '@playwright/test';
import { hasContentScript, getExtensionAPI } from './helpers/extension-helper';

test('should handle missing extension gracefully', async ({ page }) => {
  // Check if content script is present
  const isInjected = await hasContentScript(page);
  
  if (isInjected) {
    const api = await getExtensionAPI(page);
    expect(api).toBeDefined();
  } else {
    console.log('Content script not injected, continuing with DOM tests');
    // Continue with alternative testing approach
  }
});
```

### Performance Testing

```typescript
import { test, expect } from '@playwright/test';
import { getDetectedTables } from './helpers/extension-helper';

test('should inspect tables efficiently', async ({ page }) => {
  const startTime = Date.now();
  
  // Perform inspection
  const tables = await getDetectedTables(page);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`Inspected ${tables.length} tables in ${duration}ms`);
  expect(duration).toBeLessThan(100); // < 100ms
});
```

## Best Practices

1. **Always wait for extension**: Use `waitForContentScript()` before testing
2. **Handle errors**: Check for cases where extension might not be loaded
3. **Use types**: Leverage TypeScript interfaces for type safety
4. **Isolate tests**: Each test should have a clean state
5. **Clean up**: Remove test handlers and reset state when needed
6. **Document**: Add comments for complex test logic

## Contributing

When adding new helper functions:

1. Follow the existing naming conventions
2. Add JSDoc documentation
3. Include TypeScript types
4. Add examples to README
5. Test with various scenarios

## Troubleshooting

### Content Script Not Found
- Ensure extension is loaded in Chrome
- Check browser console for errors
- Verify content script matches in manifest

### Extension ID Not Detected
- Make sure extension is enabled in chrome://extensions/
- Check that extension name contains "GridKit"
- Verify DOM structure of extensions page

### Type Errors
- Ensure TypeScript version is up to date
- Check import paths
- Verify type definitions are exported
