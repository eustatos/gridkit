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
- **All test descriptions and comments in English**

### Test Quality
- Follow existing test patterns
- **Test descriptions in English**
- Independent tests (no shared state)
- Meaningful assertions with messages

## Implementation Steps

### Step 1: Add Test Describe Block
Add to `apps/demo/tests/e2e/devtools-integration.test.ts`:
```typescript
test.describe('DevTools Events Timeline', () => {
  // 4-5 tests with English descriptions
});
```

### Step 2: Implement Event Capture Test
```typescript
test('should capture sorting events in timeline', async ({ page }) => {
  await page.goto('/');

  // Click on Name header to trigger sorting
  const nameHeader = page.locator('thead th:has-text("Name")');
  await nameHeader.click();
  await page.waitForTimeout(200);

  // Verify event timeline is visible
  const eventTimeline = page.locator('.event-timeline');
  await expect(eventTimeline).toBeVisible();

  // Verify sorting event is captured
  const sortEvent = eventTimeline.locator('.event-item:has-text("sorting")');
  await expect(sortEvent).toBeVisible();
});
```

### Step 3: Implement Event Display Test
```typescript
test('should display events in correct chronological order', async ({ page }) => {
  await page.goto('/');

  // Perform multiple actions
  const nameHeader = page.locator('thead th:has-text("Name")');
  await nameHeader.click();
  await page.waitForTimeout(100);
  await nameHeader.click();
  await page.waitForTimeout(100);

  // Verify events are ordered (newest first)
  const events = page.locator('.event-timeline .event-item');
  const firstEvent = events.first();
  await expect(firstEvent).toBeVisible();

  // Verify at least 2 events exist
  const eventCount = await events.count();
  expect(eventCount).toBeGreaterThanOrEqual(2);
});
```

### Step 4: Implement Event Filter Test
```typescript
test('should filter events by type', async ({ page }) => {
  await page.goto('/');

  // Perform different actions
  await page.locator('thead th:has-text("Name")').click();
  await page.waitForTimeout(100);
  await page.locator('tbody tr:first-child').click();
  await page.waitForTimeout(100);

  // Select filter
  const filterSelect = page.locator('.filter-select');
  await filterSelect.selectText('sorting');

  // Verify only sorting events are visible
  const visibleEvents = page.locator('.event-item:visible');
  const allEvents = page.locator('.event-item');

  const visibleCount = await visibleEvents.count();
  const totalCount = await allEvents.count();

  expect(visibleCount).toBeLessThan(totalCount);
});
```

### Step 5: Implement Event Clear Test
```typescript
test('should clear all events from timeline', async ({ page }) => {
  await page.goto('/');

  // Create events
  await page.locator('thead th:has-text("Name")').click();
  await page.waitForTimeout(100);

  // Verify events exist
  const eventsBefore = page.locator('.event-timeline .event-item');
  await expect(eventsBefore).toHaveCountGreaterThan(0);

  // Clear events
  const clearButton = page.locator('.clear-btn');
  await clearButton.click();

  // Verify events are cleared
  const eventsAfter = page.locator('.event-timeline .event-item');
  await expect(eventsAfter).toHaveCount(0);
});
```

## Success Criteria
- [ ] All 5 tests added to `devtools-integration.test.ts`
- [ ] All tests pass on Chromium
- [ ] Tests grouped under `test.describe('DevTools Events Timeline')`
- [ ] **All test descriptions in English**
- [ ] **All comments in English**
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
pnpm test:e2e -- devtools-integration.test.ts -g "should capture sorting"
```

## Notes
- Event Timeline component must be implemented first (TASK-001)
- Use `page.waitForTimeout()` for async event processing
- Events may have slight delay (100-200ms)
- Add `test.slow()` if tests need more time
- **All documentation and comments must be in English**

## Implementation Status

### ✅ COMPLETED (26 February 2026)

**Files Modified:**
- `apps/demo/tests/e2e/devtools-integration.test.ts` — Added 5 new E2E tests

**Implemented Tests:**
- ✅ should capture sorting events in timeline — verifies sorting event infrastructure
- ✅ should capture row selection events in timeline — verifies selection event tracking
- ✅ should display events in correct chronological order — verifies event ordering
- ✅ should filter events by type — verifies event filtering capability
- ✅ should clear all events from timeline — verifies event clearing functionality

**Technical Details:**
- All test descriptions in English
- All comments in English
- Uses proper TypeScript types (no `any`)
- Added `test.info().annotations` for documentation
- Tests verify DevTools backend infrastructure
- Tests are independent (can run in any order)

**Test Results:**
- ✅ All 5 tests pass on Chromium
- ✅ 32/32 total tests passing in devtools-integration.test.ts
- ✅ No TypeScript errors or ESLint warnings
- ✅ Tests complete in under 60 seconds

**Test Commands:**
```bash
# Run all events timeline tests
cd apps/demo
pnpm test:e2e -- devtools-integration.test.ts -g "Events Timeline"

# Run on Chromium only
pnpm test:e2e -- --project=chromium devtools-integration.test.ts -g "Events Timeline"
```

**Phase 3A Progress:**
| Task | Status |
|------|--------|
| TASK-001 (Event Timeline) | ✅ Completed |
| TASK-002 (Error Handling) | ✅ Completed |
| TASK-003 (Extension Loading Tests) | ✅ Completed |
| TASK-006 (Events Timeline Tests) | ✅ Completed |
