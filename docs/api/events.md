# Events API Reference

The Events API provides a powerful event-driven architecture for GridKit tables with middleware support, event correlation, and type-safe event handling.

## Installation

Events are included in the core package:

```bash
npm install @gridkit/core
```

## Quick Example

```typescript
import { createTable } from '@gridkit/core';

const table = createTable({
  data,
  columns,
  features: {
    events: true,
  },
});

// Subscribe to events
table.on('row:select', (event) => {
  console.log('Row selected:', event.payload.rowId);
});

table.on('sorting:change', (event) => {
  console.log('Sorting changed:', event.payload.sorting);
});

// Emit custom events
table.emit('custom:event', { data: 'custom data' });
```

---

## EventBus

The central event hub for GridKit tables.

### Creating an EventBus

```typescript
import { EventBus } from '@gridkit/core';

const eventBus = new EventBus({
  debug: true,
  maxListeners: 100,
});
```

### Methods

#### on()

Subscribe to an event.

```typescript
on<T extends EventType>(
  event: T,
  handler: EventHandler<T>,
  options?: EventOptions
): Unsubscribe;
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `T` | Event type to subscribe to |
| `handler` | `EventHandler<T>` | Event handler function |
| `options` | `EventOptions` | Optional configuration |

**Options:**

```typescript
interface EventOptions {
  priority?: number;      // Handler priority (higher = earlier)
  namespace?: string;     // Event namespace
  once?: boolean;         // Fire only once
  correlationId?: string; // Correlation ID for tracing
}
```

**Example:**
```typescript
// Basic subscription
const unsubscribe = table.on('row:select', (event) => {
  console.log('Selected:', event.payload.rowId);
});

// With priority
table.on('sorting:change', handler, { priority: 10 });

// Fire once
table.on('table:ready', handler, { once: true });

// Namespace
table.on('row:select', handler, { namespace: 'analytics' });

// Cleanup
unsubscribe();
```

#### off()

Unsubscribe from an event.

```typescript
off<T extends EventType>(
  event: T,
  handler: EventHandler<T>
): void;
```

**Example:**
```typescript
function handler(event: RowSelectEvent) {
  console.log(event.payload.rowId);
}

table.on('row:select', handler);
table.off('row:select', handler);
```

#### emit()

Emit an event.

```typescript
emit<T extends EventType>(
  event: T,
  payload: EventPayload<T>,
  options?: EmitOptions
): void;
```

**Options:**

```typescript
interface EmitOptions {
  correlationId?: string;
  causationId?: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}
```

**Example:**
```typescript
// Simple emit
table.emit('row:select', { rowId: '123' });

// With metadata
table.emit('filtering:apply', {
  filters: [{ id: 'name', value: 'John' }],
}, {
  metadata: { source: 'user-action' },
  correlationId: 'corr-123',
});
```

#### once()

Subscribe to an event that fires only once.

```typescript
once<T extends EventType>(
  event: T,
  handler: EventHandler<T>
): Unsubscribe;
```

**Example:**
```typescript
table.once('table:ready', () => {
  console.log('Table is ready!');
});
```

#### removeAllListeners()

Remove all event listeners.

```typescript
removeAllListeners(event?: EventType): void;
```

**Example:**
```typescript
// Remove all listeners
table.removeAllListeners();

// Remove listeners for specific event
table.removeAllListeners('row:select');
```

#### listenerCount()

Get the number of listeners for an event.

```typescript
listenerCount(event: EventType): number;
```

**Example:**
```typescript
const count = table.listenerCount('row:select');
console.log(`${count} listeners for row:select`);
```

---

## Event Types

### Row Events

| Event | Payload | Description |
|-------|---------|-------------|
| `row:select` | `{ rowId: RowId, selected: boolean }` | Row selection changed |
| `row:expand` | `{ rowId: RowId, expanded: boolean }` | Row expanded/collapsed |
| `row:click` | `{ rowId: RowId, event: MouseEvent }` | Row clicked |
| `row:dblclick` | `{ rowId: RowId, event: MouseEvent }` | Row double-clicked |
| `row:contextmenu` | `{ rowId: RowId, event: MouseEvent }` | Row right-clicked |
| `row:mouseenter` | `{ rowId: RowId, event: MouseEvent }` | Mouse entered row |
| `row:mouseleave` | `{ rowId: RowId, event: MouseEvent }` | Mouse left row |

**Example:**
```typescript
table.on('row:select', (event) => {
  console.log(`Row ${event.payload.rowId} ${event.payload.selected ? 'selected' : 'deselected'}`);
});

table.on('row:expand', (event) => {
  console.log(`Row ${event.payload.rowId} ${event.payload.expanded ? 'expanded' : 'collapsed'}`);
});
```

### Column Events

| Event | Payload | Description |
|-------|---------|-------------|
| `column:resize` | `{ columnId: ColumnId, size: number }` | Column resized |
| `column:visibility` | `{ columnId: ColumnId, visible: boolean }` | Column visibility changed |
| `column:pin` | `{ columnId: ColumnId, position: 'left' | 'right' | null }` | Column pinned/unpinned |
| `column:reorder` | `{ columnId: ColumnId, from: number, to: number }` | Column reordered |
| `column:sort` | `{ columnId: ColumnId, direction: 'asc' | 'desc' | null }` | Column sorting changed |

**Example:**
```typescript
table.on('column:resize', (event) => {
  console.log(`Column ${event.payload.columnId} resized to ${event.payload.size}`);
});

table.on('column:sort', (event) => {
  console.log(`Column ${event.payload.columnId} sorted ${event.payload.direction}`);
});
```

### Filter Events

| Event | Payload | Description |
|-------|---------|-------------|
| `filtering:change` | `{ filters: Filter[] }` | Filters changed |
| `filtering:apply` | `{ filters: Filter[] }` | Filters applied |
| `filtering:clear` | `{ clearedFilters: string[] }` | Filters cleared |

**Example:**
```typescript
table.on('filtering:change', (event) => {
  console.log('Filters changed:', event.payload.filters);
});

table.on('filtering:clear', (event) => {
  console.log('Cleared filters:', event.payload.clearedFilters);
});
```

### Sorting Events

| Event | Payload | Description |
|-------|---------|-------------|
| `sorting:change` | `{ sorting: SortingState }` | Sorting state changed |
| `sorting:apply` | `{ sorting: SortingState }` | Sorting applied |
| `sorting:clear` | `{ clearedSorting: string[] }` | Sorting cleared |

**Example:**
```typescript
table.on('sorting:change', (event) => {
  console.log('Sorting changed:', event.payload.sorting);
});
```

### Pagination Events

| Event | Payload | Description |
|-------|---------|-------------|
| `pagination:change` | `{ pageIndex: number, pageSize: number }` | Pagination changed |
| `pagination:page` | `{ pageIndex: number }` | Page changed |
| `pagination:pagesize` | `{ pageSize: number }` | Page size changed |

**Example:**
```typescript
table.on('pagination:change', (event) => {
  console.log(`Page ${event.payload.pageIndex}, Size ${event.payload.pageSize}`);
});
```

### Table Events

| Event | Payload | Description |
|-------|---------|-------------|
| `table:ready` | `{ tableId: string }` | Table initialized |
| `table:destroy` | `{ tableId: string }` | Table destroyed |
| `table:reset` | `{ tableId: string }` | Table reset |
| `table:statechange` | `{ state: TableState }` | Any state changed |
| `table:render` | `{ tableId: string }` | Table rendered |

**Example:**
```typescript
table.on('table:ready', (event) => {
  console.log('Table is ready:', event.payload.tableId);
});

table.on('table:statechange', (event) => {
  console.log('State changed:', event.payload.state);
});
```

### Data Events

| Event | Payload | Description |
|-------|---------|-------------|
| `data:load` | `{ data: TData[], count: number }` | Data loaded |
| `data:change` | `{ data: TData[], changes: DataChange[] }` | Data changed |
| `data:error` | `{ error: Error }` | Data loading error |

**Example:**
```typescript
table.on('data:load', (event) => {
  console.log(`Loaded ${event.payload.count} rows`);
});

table.on('data:error', (event) => {
  console.error('Data error:', event.payload.error);
});
```

### Performance Events

| Event | Payload | Description |
|-------|---------|-------------|
| `performance:budgetViolation` | `{ operation: string, actual: number, budget: number }` | Budget exceeded |
| `performance:warning` | `{ operation: string, duration: number }` | Slow operation |
| `performance:report` | `{ metrics: PerformanceMetrics }` | Performance report |

**Example:**
```typescript
table.on('performance:budgetViolation', (event) => {
  console.warn(
    `Performance budget violated: ${event.payload.operation} ` +
    `took ${event.payload.actual}ms (budget: ${event.payload.budget}ms)`
  );
});
```

### Validation Events

| Event | Payload | Description |
|-------|---------|-------------|
| `validation:start` | `{ rowIndex: number, data: unknown }` | Validation started |
| `validation:complete` | `{ rowIndex: number, valid: boolean, errors: ValidationError[] }` | Validation completed |
| `validation:error` | `{ rowIndex: number, errors: ValidationError[] }` | Validation errors |

**Example:**
```typescript
table.on('validation:error', (event) => {
  console.error(`Validation errors in row ${event.payload.rowIndex}:`, event.payload.errors);
});
```

### Plugin Events

| Event | Payload | Description |
|-------|---------|-------------|
| `plugin:register` | `{ pluginId: string }` | Plugin registered |
| `plugin:initialize` | `{ pluginId: string }` | Plugin initialized |
| `plugin:destroy` | `{ pluginId: string }` | Plugin destroyed |
| `plugin:error` | `{ pluginId: string, error: Error }` | Plugin error |

**Example:**
```typescript
table.on('plugin:initialize', (event) => {
  console.log(`Plugin initialized: ${event.payload.pluginId}`);
});
```

---

## Middleware

Middleware allows you to intercept and modify events before they reach handlers.

### Creating Middleware

```typescript
import { Middleware } from '@gridkit/core';

const loggingMiddleware: Middleware = {
  name: 'logging',
  process(event, payload, next) {
    console.log(`Event: ${event}`, payload);
    return next(event, payload);
  },
};
```

### Built-in Middleware

#### Logging Middleware

Logs all events to console.

```typescript
import { createLoggingMiddleware } from '@gridkit/core';

const logging = createLoggingMiddleware({
  logger: console,
  includePayload: true,
  includeTimestamp: true,
});

table.use(logging);
```

#### Debounce Middleware

Debounces events by specified delay.

```typescript
import { createDebounceMiddleware } from '@gridkit/core';

const debounce = createDebounceMiddleware({
  wait: 300,
  events: ['filtering:change', 'sorting:change'],
});

table.use(debounce);
```

#### Throttle Middleware

Throttles events to specified interval.

```typescript
import { createThrottleMiddleware } from '@gridkit/core';

const throttle = createThrottleMiddleware({
  limit: 1000, // 1 second
  events: ['column:resize'],
});

table.use(throttle);
```

#### Filter Middleware

Filters events based on condition.

```typescript
import { createFilterMiddleware } from '@gridkit/core';

const filter = createFilterMiddleware({
  predicate: (event, payload) => {
    // Only allow row:select events
    return event === 'row:select';
  },
});

table.use(filter);
```

#### Validation Middleware

Validates event payloads.

```typescript
import { createValidationMiddleware } from '@gridkit/core';
import { z } from 'zod';

const validation = createValidationMiddleware({
  schema: z.object({
    rowId: z.string(),
    selected: z.boolean(),
  }),
  events: ['row:select'],
});

table.use(validation);
```

### Using Middleware

```typescript
import {
  createLoggingMiddleware,
  createDebounceMiddleware,
  createValidationMiddleware,
} from '@gridkit/core';

// Create middleware
const logging = createLoggingMiddleware();
const debounce = createDebounceMiddleware({ wait: 300 });

// Add to table
table.use(logging);
table.use(debounce);

// Or add during creation
const table = createTable({
  data,
  columns,
  features: {
    events: {
      middleware: [logging, debounce],
    },
  },
});

// Remove middleware
table.unuse('logging');
```

---

## Event Correlation

Track related events across the system.

### Correlation IDs

```typescript
// Start a correlation context
const correlationId = table.events.createCorrelationId();

// All events in this context will share the correlation ID
table.emit('filtering:apply', { filters }, { correlationId });
table.emit('data:load', { data });

// End correlation context
table.events.endCorrelation(correlationId);
```

### Causation

Track cause-and-effect relationships.

```typescript
table.on('filtering:apply', (event) => {
  // This event was caused by the filtering event
  const causationId = event.metadata.correlationId;
  
  table.emit('data:load', { data }, {
    causationId,
    correlationId: causationId,
  });
});
```

---

## Event Sourcing

Record and replay events for debugging.

### Recording Events

```typescript
import { EventRecorder } from '@gridkit/core';

const recorder = new EventRecorder(table.events);

// Start recording
recorder.start();

// ... perform actions ...

// Stop recording
recorder.stop();

// Get recorded events
const events = recorder.getEvents();
console.log(`Recorded ${events.length} events`);
```

### Replaying Events

```typescript
import { EventReplayer } from '@gridkit/core';

const replayer = new EventReplayer(table.events);

// Replay all events
await replayer.replay(events);

// Replay with options
await replayer.replay(events, {
  speed: 2, // 2x speed
  filter: (event) => event.type === 'row:select',
});
```

### Time Travel

```typescript
import { TimeTravelManager } from '@gridkit/core';

const timeTravel = new TimeTravelManager(table);

// Create snapshot
const snapshot = timeTravel.createSnapshot();

// ... make changes ...

// Restore snapshot
timeTravel.restoreSnapshot(snapshot);

// Travel back N steps
timeTravel.travelBack(3);

// List all snapshots
const snapshots = timeTravel.listSnapshots();
```

---

## Examples

### Analytics Tracking

```typescript
// Track all user interactions
table.on('row:select', (event) => {
  analytics.track('Table Row Selected', {
    rowId: event.payload.rowId,
    timestamp: event.metadata.timestamp,
  });
});

table.on('sorting:change', (event) => {
  analytics.track('Table Sorted', {
    sorting: event.payload.sorting,
  });
});

table.on('filtering:apply', (event) => {
  analytics.track('Table Filtered', {
    filterCount: event.payload.filters.length,
  });
});
```

### Audit Logging

```typescript
// Log all data modifications
table.on('data:change', (event) => {
  auditLog.log({
    action: 'DATA_CHANGE',
    changes: event.payload.changes,
    timestamp: event.metadata.timestamp,
    userId: getCurrentUserId(),
  });
});

table.on('row:select', (event) => {
  auditLog.log({
    action: 'ROW_SELECTION',
    rowId: event.payload.rowId,
    selected: event.payload.selected,
  });
});
```

### Auto-save Preferences

```typescript
import { createDebounceMiddleware } from '@gridkit/core';

// Debounce state changes
const debounce = createDebounceMiddleware({
  wait: 1000,
  events: ['table:statechange'],
});

table.use(debounce);

// Auto-save user preferences
table.on('table:statechange', (event) => {
  userPreferences.save({
    sorting: event.payload.state.sorting,
    columnVisibility: event.payload.state.columnVisibility,
    columnOrder: event.payload.state.columnOrder,
    pagination: event.payload.state.pagination,
  });
});
```

### Real-time Sync

```typescript
// Sync table changes to server
table.on('data:change', async (event) => {
  try {
    await api.syncChanges(event.payload.changes);
  } catch (error) {
    console.error('Sync failed:', error);
    // Queue for retry
    syncQueue.add(event.payload.changes);
  }
});

// Apply remote changes
function applyRemoteChanges(changes: DataChange[]) {
  changes.forEach((change) => {
    table.emit('data:remote-change', change);
  });
}
```

### Performance Monitoring

```typescript
// Monitor slow operations
table.on('performance:warning', (event) => {
  if (event.payload.duration > 1000) {
    sentry.captureMessage('Slow table operation', {
      level: 'warning',
      tags: { operation: event.payload.operation },
      extra: { duration: event.payload.duration },
    });
  }
});

// Track budget violations
table.on('performance:budgetViolation', (event) => {
  console.error(
    `Budget violated: ${event.payload.operation} ` +
    `${event.payload.actual}ms / ${event.payload.budget}ms`
  );
});
```

---

## Best Practices

### 1. Use Specific Event Types

```typescript
// ✅ Good - specific event
table.on('row:select', handler);

// ❌ Bad - too generic
table.on('table:*', handler);
```

### 2. Always Cleanup

```typescript
useEffect(() => {
  const unsubscribe = table.on('row:select', handler);
  return () => unsubscribe();
}, [table]);
```

### 3. Use Middleware for Cross-Cutting Concerns

```typescript
// ✅ Good - middleware for logging
table.use(createLoggingMiddleware());

// ❌ Bad - logging in every handler
table.on('row:select', (e) => { console.log(e); });
table.on('sorting:change', (e) => { console.log(e); });
```

### 4. Include Metadata

```typescript
// ✅ Good - with metadata
table.emit('row:select', { rowId }, {
  metadata: { source: 'user-action' },
  correlationId: generateId(),
});

// ❌ Bad - no context
table.emit('row:select', { rowId });
```

### 5. Handle Errors

```typescript
table.on('data:error', (event) => {
  console.error('Data error:', event.payload.error);
  showErrorNotification('Failed to load data');
});
```

---

## Troubleshooting

### Events not firing

**Check:**
- Events feature is enabled: `features.events: true`
- Event type is correct
- Handler is registered before event is emitted

```typescript
// Debug: check listeners
console.log(table.listenerCount('row:select'));
```

### Middleware not working

**Check:**
- Middleware is added before events are emitted
- Middleware calls `next()` to continue chain
- No errors in middleware `process()` method

```typescript
const middleware = {
  name: 'test',
  process(event, payload, next) {
    console.log('Middleware called');
    return next(event, payload); // Don't forget to call next!
  },
};
```

### Memory leaks

**Check:**
- All subscriptions are cleaned up
- Using `unsubscribe()` in cleanup functions
- Not accumulating listeners

```typescript
// Check for accumulated listeners
console.log(table.listenerCount('row:select')); // Should be stable
```

---

## See Also

- [Core API](core.md) - Table creation and management
- [Plugin API](plugin.md) - Plugin development
- [Debug System](../debug/debug-system.md) - Event debugging tools
- [Performance Monitoring](../packages/core/src/performance/README.md) - Performance events
