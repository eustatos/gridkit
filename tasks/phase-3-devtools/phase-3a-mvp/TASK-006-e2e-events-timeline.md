# TASK-006: E2E Tests for DevTools Events Timeline

## Goal
Create E2E tests that verify the Event Timeline component correctly displays table events in real-time.

## Context
After implementing the Event Timeline component (TASK-001), these tests verify that events are captured and displayed correctly when table actions occur.

## Current State
- `apps/demo/tests/e2e/devtools-integration.test.ts` — existing test file
- Event Timeline component implemented (after TASK-001)
- Backend sends `EVENT_LOGGED` events
- No tests for event timeline functionality

## Requirements

### 1. Event Capture Tests
Verify that:
- Sorting events are captured
- Row selection events are captured
- Pagination events are captured
- Events show correct timestamp

### 2. Event Display Tests
Verify that:
- Events appear in timeline immediately
- Events show correct type and payload
- Events are ordered (newest first)
- Event count updates correctly

### 3. Event Filter Tests
Verify that:
- Filter by event type works
- Clear filter shows all events
- Filter persists across actions

### 4. Event Clear Tests
Verify that:
- Clear button removes all events
- Event count resets to zero
- New events appear after clear

## Technical Requirements

### TypeScript Best Practices
- **NO `any` types** — use proper types for page evaluation
- Define interfaces for event data structures
- Use type guards for runtime validation

### Playwright Best Practices
- Use `test.describe()` for test grouping
- Use `test.beforeEach()` for common setup
- Use explicit waits (`waitForSelector`, `toBeVisible`)
- Add test annotations with `test.info().annotations`

### Test Quality
- Follow existing test patterns
- Test descriptions in Russian
- Independent tests (no shared state)
- Meaningful assertions with messages

## Implementation Steps

### Step 1: Add Test Describe Block
Add to `apps/demo/tests/e2e/devtools-integration.test.ts`:
```typescript
test.describe('DevTools Events Timeline', () => {
  // 4-5 tests
});
```

### Step 2: Implement Event Capture Test
```typescript
test('должен фиксировать события сортировки', async ({ page }) => {
  await page.goto('/');

  // Клик по заголовку для сортировки
  const nameHeader = page.locator('thead th:has-text("Name")');
  await nameHeader.click();
  await page.waitForTimeout(200);

  // Проверка, что событие отображается в timeline
  const eventTimeline = page.locator('.event-timeline');
  await expect(eventTimeline).toBeVisible();

  const sortEvent = eventTimeline.locator('.event-item:has-text("sorting")');
  await expect(sortEvent).toBeVisible();
});
```

### Step 3: Implement Event Display Test
```typescript
test('должен отображать события в правильном порядке', async ({ page }) => {
  await page.goto('/');

  // Выполняем несколько действий
  const nameHeader = page.locator('thead th:has-text("Name")');
  await nameHeader.click();
  await page.waitForTimeout(100);
  await nameHeader.click();
  await page.waitForTimeout(100);

  // Проверка порядка событий (новейшие сверху)
  const events = page.locator('.event-timeline .event-item');
  const firstEvent = events.first();
  await expect(firstEvent).toBeVisible();

  // Проверка, что событий больше одного
  const eventCount = await events.count();
  expect(eventCount).toBeGreaterThanOrEqual(2);
});
```

### Step 4: Implement Event Filter Test
```typescript
test('должен фильтровать события по типу', async ({ page }) => {
  await page.goto('/');

  // Выполняем разные действия
  await page.locator('thead th:has-text("Name")').click();
  await page.waitForTimeout(100);
  await page.locator('tbody tr:first-child').click();
  await page.waitForTimeout(100);

  // Выбираем фильтр
  const filterSelect = page.locator('.event-filter');
  await filterSelect.selectText('sorting');

  // Проверка, что видны только события сортировки
  const visibleEvents = page.locator('.event-item:visible');
  const allEvents = page.locator('.event-item');
  
  const visibleCount = await visibleEvents.count();
  const totalCount = await allEvents.count();
  
  expect(visibleCount).toBeLessThan(totalCount);
});
```

### Step 5: Implement Event Clear Test
```typescript
test('должен очищать список событий', async ({ page }) => {
  await page.goto('/');

  // Создаём события
  await page.locator('thead th:has-text("Name")').click();
  await page.waitForTimeout(100);

  // Проверяем, что события есть
  const eventsBefore = page.locator('.event-timeline .event-item');
  await expect(eventsBefore).toHaveCountGreaterThan(0);

  // Очищаем события
  const clearButton = page.locator('.event-clear-button');
  await clearButton.click();

  // Проверяем, что событий нет
  const eventsAfter = page.locator('.event-timeline .event-item');
  await expect(eventsAfter).toHaveCount(0);
});
```

## Success Criteria
- [ ] All 5 tests added to `devtools-integration.test.ts`
- [ ] All tests pass on Chromium
- [ ] Tests grouped under `test.describe('DevTools Events Timeline')`
- [ ] Test descriptions in Russian
- [ ] No TypeScript errors or ESLint warnings
- [ ] Tests complete in under 60 seconds

## Related Files
- `apps/demo/tests/e2e/devtools-integration.test.ts` (update)
- `packages/devtools/extension/panel/components/EventTimeline.tsx` (reference)

## Test Commands
```bash
# Run all events timeline tests
cd apps/demo
pnpm test:e2e -- devtools-integration.test.ts -g "Events Timeline"

# Run single test
pnpm test:e2e -- devtools-integration.test.ts -g "должен фиксировать события"
```

## Notes
- Event Timeline component must be implemented first (TASK-001)
- Use `page.waitForTimeout()` for async event processing
- Events may have slight delay (100-200ms)
- Add `test.slow()` if tests need more time
