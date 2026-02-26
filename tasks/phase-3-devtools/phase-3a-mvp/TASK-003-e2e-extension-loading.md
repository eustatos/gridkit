# TASK-003: E2E Tests for DevTools Extension Loading

## Goal
Create E2E tests that verify the DevTools extension loads correctly in the browser and integrates with the demo application.

## Context
This is a foundational test task — all other E2E tests depend on the extension loading correctly. These tests ensure the extension injection mechanism works.

## Current State
- Playwright configuration exists in `apps/demo/playwright.config.ts`
- Extension path is configured
- Basic test file exists: `apps/demo/tests/e2e/devtools-integration.test.ts`
- No dedicated tests for extension loading

## Requirements

### 1. Extension Load Tests
Verify that:
- Extension loads in Chromium browser
- Extension scripts are injected into page
- DevTools backend is available on `window`
- Bridge connection is established

### 2. Integration Tests
Verify that:
- Demo application works with extension loaded
- No console errors from extension
- Extension doesn't break application functionality

### 3. Configuration Tests
Verify that:
- Extension path is correct
- Extension manifest is valid
- Required permissions are granted

## Technical Requirements

### TypeScript Best Practices
- **NO `any` types** — use proper types for page evaluation
- Define interfaces for window extensions
- Use `unknown` with type guards for runtime checks

### Playwright Best Practices
- Use `test.describe()` for test grouping
- Use `test.beforeEach()` for setup
- Use `test.expect()` for assertions
- Add meaningful test descriptions in Russian (as per project convention)

### Code Quality
- Follow existing test patterns in `devtools-integration.test.ts`
- Add comments in Russian
- Keep tests independent (no shared state)
- Use meaningful test IDs

## Implementation Steps

### Step 1: Add Test Describe Block
Add to `apps/demo/tests/e2e/devtools-integration.test.ts`:
```typescript
test.describe('DevTools Extension Loading', () => {
  // 3-4 tests
});
```

### Step 2: Implement Extension Load Test
```typescript
test('должен загружать расширение в браузере', async ({ page }) => {
  await page.goto('/');

  // Проверка, что DevTools backend доступен
  const backendExists = await page.evaluate(() => {
    return typeof (window as any).__GRIDKIT_DEVTOOLS_BACKEND__ !== 'undefined';
  });

  expect(backendExists).toBe(true);
});
```

### Step 3: Implement Bridge Connection Test
```typescript
test('должен устанавливать соединение с DevTools', async ({ page }) => {
  await page.goto('/');

  // Проверка, что bridge подключён
  const bridgeConnected = await page.evaluate(() => {
    const backend = (window as any).__GRIDKIT_DEVTOOLS_BACKEND__;
    return backend && typeof backend.registerTable === 'function';
  });

  expect(bridgeConnected).toBe(true);
});
```

### Step 4: Implement Integration Test
```typescript
test('не должен ломать функциональность приложения', async ({ page }) => {
  await page.goto('/');

  // Проверка, что таблица отображается
  const table = page.locator('table');
  await expect(table).toBeVisible();

  // Проверка отсутствия ошибок в консоли
  let errorCount = 0;
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errorCount++;
    }
  });

  await page.waitForTimeout(1000);
  expect(errorCount).toBe(0);
});
```

### Step 5: Implement Extension Path Test
```typescript
test('должен иметь корректный путь к расширению', async ({ page }) => {
  // Проверка через evaluate, что extension загружен
  const extensionInfo = await page.evaluate(() => {
    return {
      backendExists: typeof (window as any).__GRIDKIT_DEVTOOLS_BACKEND__ !== 'undefined',
      contentExists: typeof (window as any).__GRIDKIT_DEVTOOLS_CONTENT__ !== 'undefined'
    };
  });

  expect(extensionInfo.backendExists).toBe(true);
  expect(extensionInfo.contentExists).toBe(true);
});
```

## Success Criteria
- [ ] All 4 tests added to `devtools-integration.test.ts`
- [ ] All tests pass on Chromium
- [ ] Tests are grouped under `test.describe('DevTools Extension Loading')`
- [ ] Test descriptions in Russian
- [ ] No TypeScript errors or ESLint warnings
- [ ] Tests are independent (can run in any order)

## Related Files
- `apps/demo/tests/e2e/devtools-integration.test.ts` (update)
- `apps/demo/playwright.config.ts` (reference)
- `packages/devtools/extension/manifest.json` (reference)

## Test Commands
```bash
# Run all extension loading tests
cd apps/demo
pnpm test:e2e -- devtools-integration.test.ts -g "Extension Loading"

# Run single test
pnpm test:e2e -- devtools-integration.test.ts -g "должен загружать расширение"
```

## Notes
- Extension must be built before running tests: `pnpm build:devtools`
- Tests should run in under 30 seconds total
- Use `page.waitForTimeout()` sparingly (prefer explicit waits)
- Add `test.info().annotations` for documentation
