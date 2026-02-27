# TASK-005: Implement Performance Metrics Emission in GridKit Core

## Goal

Implement automatic performance metrics emission in GridKit core tables so DevTools can display real-time performance data.

## Context

The DevTools Performance Monitor component is implemented and ready to display metrics, but it shows "Performance monitoring coming soon" because the core table library does not emit performance events. The backend is set up to listen for `performance:measured` events, but tables never emit them.

**Current Flow:**

```
Table Operations → ??? → DevToolsBackend → DevToolsPanel → PerformanceMonitor
                     ↑
              MISSING: Event emission
```

**Required Flow:**

```
Table Operations → performance:measured event → DevToolsBackend → DevToolsPanel → PerformanceMonitor
```

## Current State

### Implemented (Ready to Receive)

- ✅ `PerformanceMonitor` component in DevToolsPanel
- ✅ `DevToolsBackend.setupTableListeners()` subscribes to `performance:measured`
- ✅ `PERFORMANCE_UPDATE` message type defined in protocol
- ✅ `PerformanceMetrics` interface defined

### Not Implemented (Missing)

- ❌ Core tables do not emit `performance:measured` events
- ❌ No performance tracking in table operations
- ❌ TanStack adapter does not emit performance events

## Requirements

### 1. Core Table Event Emission

Emit `performance:measured` event after table operations:

```typescript
// After setState
this.emit('performance:measured', {
  timestamp: Date.now(),
  tableId: this.options.tableId,
  renderCount: this.metrics.renderCount,
  lastRenderDuration: this.metrics.lastRenderDuration,
  averageRenderDuration: this.metrics.averageRenderDuration,
  totalRenderTime: this.metrics.totalRenderTime,
  reRenderReason: 'setState',
});
```

### 2. Operations to Track

Track performance for these operations:

| Operation       | Event Trigger         | Metrics                            |
| --------------- | --------------------- | ---------------------------------- |
| `setState()`    | After state update    | renderCount, lastRenderDuration    |
| `getRowModel()` | After model build     | totalRenderTime                    |
| Sorting         | After sort complete   | lastRenderDuration, reRenderReason |
| Filtering       | After filter complete | lastRenderDuration, reRenderReason |
| Pagination      | After page change     | lastRenderDuration, reRenderReason |

### 3. PerformanceMetrics Interface

Metrics must match the interface in `protocol.ts`:

```typescript
export interface PerformanceMetrics {
  timestamp: number;
  tableId: string;
  renderCount: number;
  lastRenderDuration: number | null;
  averageRenderDuration: number | null;
  totalRenderTime: number;
  reRenderReason: string | null;
  memoryUsage?: number;
  eventCount?: number;
}
```

### 4. TanStack Adapter Integration

For tables using `@gridkit/tanstack-adapter`, emit events from adapter:

```typescript
// In useGridEnhancedTable hook
useEffect(() => {
  const unsubscribe = table.on('performance:measured', (metrics) => {
    // Emit to DevTools
    devToolsBackend.sendPerformanceUpdate(tableId, metrics);
  });
  return unsubscribe;
}, [table]);
```

## Implementation Steps

### Step 1: Add Performance Tracking to Core Table

**File:** `packages/core/src/table/Table.ts`

Add performance tracking properties:

```typescript
export class Table<TData extends RowData> {
  private performanceMetrics: {
    renderCount: number;
    lastRenderDuration: number | null;
    averageRenderDuration: number | null;
    totalRenderTime: number;
  } = {
    renderCount: 0,
    lastRenderDuration: null,
    averageRenderDuration: null,
    totalRenderTime: 0,
  };

  private trackPerformance(operation: string, duration: number): void {
    this.performanceMetrics.renderCount++;
    this.performanceMetrics.lastRenderDuration = duration;
    this.performanceMetrics.totalRenderTime += duration;
    this.performanceMetrics.averageRenderDuration =
      this.performanceMetrics.totalRenderTime / this.performanceMetrics.renderCount;

    // Emit event
    this.emit('performance:measured', {
      timestamp: Date.now(),
      tableId: this.options.tableId || `table-${this.id}`,
      renderCount: this.performanceMetrics.renderCount,
      lastRenderDuration: this.performanceMetrics.lastRenderDuration,
      averageRenderDuration: this.performanceMetrics.averageRenderDuration,
      totalRenderTime: this.performanceMetrics.totalRenderTime,
      reRenderReason: operation,
    });
  }
}
```

### Step 2: Integrate with setState

**File:** `packages/core/src/table/Table.ts`

```typescript
setState(updater: Updater<Partial<TableState<TData>>>): void {
  const startTime = performance.now();

  // Existing setState logic
  const newState = this.stateReducer(this.state, updater);
  this.state = newState;

  // Track performance
  const duration = performance.now() - startTime;
  this.trackPerformance('setState', duration);

  // Notify listeners
  this.notifyStateChange();
}
```

### Step 3: Integrate with Row Model Build

**File:** `packages/core/src/row/factory/build-row-model.ts`

```typescript
export function buildRowModel<TData extends RowData>({
  data,
  columns,
  table
}: BuildRowModelOptions<TData>): RowModel<TData> {
  const startTime = performance.now();

  // Existing build logic
  const rows = data.map((item, index) => createRow({ ... }));

  const duration = performance.now() - startTime;

  // Emit performance event
  table?.emit('performance:measured', {
    timestamp: Date.now(),
    tableId: table.options.tableId || `table-${table.id}`,
    renderCount: table.metrics?.renderCount || 1,
    lastRenderDuration: duration,
    averageRenderDuration: duration,
    totalRenderTime: duration,
    reRenderReason: 'buildRowModel'
  });

  return {
    rows,
    flatRows,
    rowsById
  };
}
```

### Step 4: Update TanStack Adapter

**File:** `packages/tanstack-adapter/src/core/createEnhancedTable.ts`

```typescript
export function useGridEnhancedTable<TData extends RowData>(
  options: UseGridEnhancedTableOptions<TData>
): EnhancedTable<TData> {
  const table = createTable(options);

  // Subscribe to performance events and forward to DevTools
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unsubscribe = table.on('performance:measured', (metrics) => {
      const devToolsBackend = (window as any).__GRIDKIT_DEVTOOLS__;
      if (devToolsBackend) {
        devToolsBackend.sendPerformanceUpdate(table.id, metrics);
      }
    });

    return unsubscribe;
  }, [table]);

  return table;
}
```

### Step 5: Add DevToolsBackend Helper Method

**File:** `packages/devtools/backend/DevToolsBackend.ts`

```typescript
export class DevToolsBackend {
  // ... existing code ...

  sendPerformanceUpdate(tableId: string, metrics: PerformanceMetrics): void {
    this.bridge.send({
      type: 'PERFORMANCE_UPDATE',
      tableId,
      payload: {
        metrics,
        timestamp: Date.now(),
      },
    });
  }
}
```

## Success Criteria

- [ ] PerformanceMonitor in DevTools shows real-time metrics
- [ ] Render count updates on table operations
- [ ] Render duration displayed in milliseconds (e.g., "12.45 ms")
- [ ] Average render duration calculated correctly
- [ ] Total render time accumulates correctly
- [ ] Re-render reason displayed (e.g., "setState", "sorting", "filtering")
- [ ] No TypeScript errors or ESLint warnings
- [ ] Build passes with strict TypeScript types
- [ ] Performance overhead < 1ms per operation

## Performance Budgets

Event emission must not impact performance:

| Metric                  | Budget    | Measurement       |
| ----------------------- | --------- | ----------------- |
| Event emission overhead | < 0.1ms   | performance.now() |
| Memory per table        | < 1KB     | heap snapshot     |
| Event frequency         | < 100/sec | rate limiting     |

## Testing

### Manual Testing

1. Open demo app with DevTools
2. Select a table
3. Navigate to Performance tab
4. Perform table operations:
   - Sort columns
   - Apply filters
   - Change pages
   - Select rows
5. Verify metrics update in real-time

### Expected Results

```
Initial Load:
- Render Count: 1
- Last Render: 45.23 ms
- Average Render: 45.23 ms
- Total Time: 45.23 ms
- Re-render Reason: buildRowModel

After Sort:
- Render Count: 2
- Last Render: 12.45 ms
- Average Render: 28.84 ms
- Total Time: 57.68 ms
- Re-render Reason: sorting
```

## Related Files

### Core Package

- `packages/core/src/table/Table.ts` (main)
- `packages/core/src/table/createTable.ts` (factory)
- `packages/core/src/row/factory/build-row-model.ts` (row model)
- `packages/core/src/performance/` (existing monitoring)

### TanStack Adapter

- `packages/tanstack-adapter/src/core/createEnhancedTable.ts`
- `packages/tanstack-adapter/src/hooks/useGridEnhancedTable.ts`

### DevTools

- `packages/devtools/backend/DevToolsBackend.ts` (backend)
- `packages/devtools/bridge/protocol.ts` (types)
- `packages/devtools/extension/panel/components/PerformanceMonitor.tsx` (UI)

## Dependencies

- ✅ TASK-004: Performance Monitor component (COMPLETE)
- ⏳ This task: Performance metrics emission
- ⏳ Future: Performance history and trend analysis

## Notes

### Event Naming Convention

Use consistent event naming:

```typescript
// Core events
'performance:measured'; // General performance update
'performance:budgetViolation'; // Budget exceeded
'performance:warning'; // Performance warning

// Operation-specific
'sorting:complete';
'filtering:complete';
'pagination:complete';
```

### Backwards Compatibility

Event emission should be optional and disabled by default in production:

```typescript
const table = createTable({
  data,
  columns,
  debug: {
    performance: true, // Enable in development
  },
});
```

### Memory Management

Clean up event listeners to prevent memory leaks:

```typescript
useEffect(() => {
  const unsubscribe = table.on('performance:measured', handler);
  return () => unsubscribe();
}, [table]);
```

## Estimated Effort

- **Complexity:** Medium
- **Time:** 4-6 hours
- **Risk:** Low (isolated changes, no breaking changes)

## Next Steps

After completion:

1. Test with demo application
2. Verify DevTools Performance Monitor displays data
3. Add performance regression tests
4. Document in DevTools guide
