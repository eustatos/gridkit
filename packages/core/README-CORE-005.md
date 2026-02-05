# CORE-005: Event System Implementation

This document describes the implementation of the Event System and Event Bus for GridKit.

## Overview

The Event System provides a robust, type-safe mechanism for component communication in GridKit. It implements a publish/subscribe pattern with strict TypeScript typing and supports various advanced features like event prioritization, middleware, and batch processing.

## Key Features

1. **Type-Safe Event Registry**: Strongly-typed event definitions with compile-time validation
2. **Event Bus Core API**: Comprehensive API for event subscription and emission
3. **Advanced Features**: Event priority levels, middleware support, async handling
4. **Performance Optimizations**: Event batching, debouncing/throttling, priority queue
5. **Memory Management**: Automatic cleanup to prevent memory leaks
6. **DevTools Integration**: Event logging and statistics

## Event Types

The system supports a comprehensive set of event types organized by namespace:

- `grid:*` - Grid lifecycle events
- `column:*` - Column operations
- `column-group:*` - Column grouping
- `row:*` - Row operations
- `cell:*` - Cell-level events
- `selection:*` - Selection state
- `virtualization:*` - Viewport events
- `sorting:*` - Sort operations
- `filtering:*` - Filter operations
- `validation:*` - Validation results
- `config:*` - Configuration changes
- `plugin:*` - Plugin system
- `state:*` - State management
- `data:*` - Data operations
- `custom:*` - User-defined events

## API Reference

### EventBus Class

#### Constructor
```typescript
const bus = new EventBus({ devMode?: boolean });
```

#### Methods

##### `on(event, handler, options)`
Subscribe to an event.

```typescript
const unsubscribe = bus.on('row:add', (event) => {
  console.log('Row added:', event.payload.rowId);
});
```

Options:
- `priority`: EventPriority - Execution priority
- `once`: boolean - One-time subscription
- `filter`: (event) => boolean - Conditional handler

##### `once(event, handler)`
Subscribe to an event once.

```typescript
bus.once('grid:ready', (event) => {
  console.log('Grid is ready');
});
```

##### `off(event, handler)`
Unsubscribe from an event.

```typescript
const unsubscribe = bus.on('row:update', handler);
unsubscribe(); // or bus.off('row:update', handler)
```

##### `emit(event, payload, options)`
Emit an event.

```typescript
bus.emit('row:add', {
  rowId: createRowId('123'),
  index: 0,
  isNew: true
});
```

Options:
- `priority`: EventPriority - Execution priority
- `source`: string - Event source identifier
- `metadata`: Record<string, unknown> - Additional metadata

##### `emitBatch(events)`
Emit multiple events efficiently.

```typescript
bus.emitBatch([
  {
    event: 'row:add',
    payload: { rowId: createRowId('1'), index: 0, isNew: true }
  },
  {
    event: 'row:add',
    payload: { rowId: createRowId('2'), index: 1, isNew: true }
  }
]);
```

##### `use(middleware)`
Add middleware.

```typescript
const removeMiddleware = bus.use((event) => {
  // Process or modify event
  return event; // Return null to cancel
});
```

##### `getStats()`
Get event bus statistics.

```typescript
const stats = bus.getStats();
console.log(`Total events: ${stats.totalEvents}`);
```

##### `clear()`
Clear all handlers and reset state.

```typescript
bus.clear(); // Removes all handlers and middleware
```

### Helper Functions

#### `getEventBus()`
Get global event bus instance.

```typescript
import { getEventBus } from '@gridkit/core/events';
const bus = getEventBus();
```

#### `createEventBus(options)`
Create isolated event bus instance.

```typescript
import { createEventBus } from '@gridkit/core/events';
const bus = createEventBus({ devMode: true });
```

#### `resetEventBus()`
Reset singleton event bus (for testing).

```typescript
import { resetEventBus } from '@gridkit/core/events';
resetEventBus();
```

## Middleware

### Built-in Middleware

#### Batch Middleware
Coalesces similar events within a time window.

```typescript
import { createBatchMiddleware } from '@gridkit/core/events';

const batchMiddleware = createBatchMiddleware({
  window: 50,    // 50ms time window
  maxSize: 10    // Max 10 events per batch
});

bus.use(batchMiddleware);
```

#### Debounce Middleware
Delays event emission until a quiet period.

```typescript
import { createDebounceMiddleware } from '@gridkit/core/events';

const debounceMiddleware = createDebounceMiddleware(100); // 100ms delay
bus.use(debounceMiddleware);
```

## Performance

The Event System is optimized for performance:

- Event emission < 0.1ms (p95)
- Efficient handler execution
- Priority-based scheduling
- Memory leak prevention
- Bundle size < 2.5KB (gzipped)

## Testing

The implementation includes comprehensive tests:

- Type safety verification
- Event emission and handling
- Priority scheduling
- Middleware functionality
- Memory management
- Performance benchmarks

## Usage Examples

### Basic Usage
```typescript
import { getEventBus } from '@gridkit/core/events';

const bus = getEventBus();

// Subscribe to events
const unsubscribe = bus.on('row:add', (event) => {
  console.log('Row added:', event.payload.rowId);
});

// Emit events
bus.emit('row:add', {
  rowId: createRowId('123'),
  index: 0,
  isNew: true,
});

// Cleanup
unsubscribe();
```

### Custom Event Registration
```typescript
declare module '@gridkit/core/events' {
  interface EventRegistry {
    'custom:my-event': {
      customData: string;
    };
  }
}

// Now you can use the custom event with full type safety
bus.on('custom:my-event', (event) => {
  console.log('Custom data:', event.payload.customData);
});

bus.emit('custom:my-event', {
  customData: 'Hello, world!'
});
```

### Plugin Communication
```typescript
bus.on('plugin:register', (event) => {
  console.log(`Plugin registered: ${event.payload.pluginId}`);
});

bus.on('plugin:error', (event) => {
  console.error(`Plugin error: ${event.payload.error}`);
});
```

### State Management
```typescript
bus.on('state:update', (event) => {
  console.log('State updated:', event.payload.changedKeys);
});

bus.on('data:load', (event) => {
  console.log('Data loaded:', event.payload.data.length);
});
```

## Best Practices

1. **Use appropriate event priorities** - Reserve IMMEDIATE for critical operations only
2. **Unsubscribe when done** - Prevent memory leaks by unsubscribing
3. **Use batch operations** - For multiple related events, use emitBatch
4. **Leverage middleware** - For cross-cutting concerns like logging or debouncing
5. **Follow naming conventions** - Use namespace:event-name format
6. **Handle errors gracefully** - Async handlers should catch their own errors

## Architecture

The Event System follows a modular architecture:

```
packages/core/src/events/
├── types.ts              # Event type definitions
├── EventBus.ts           # Core event bus implementation
├── index.ts              # Public API exports
├── middleware/           # Event middleware
│   ├── batch.ts         # Event batching
│   └── debounce.ts     # Debounce middleware
└── utils/               # Utility functions
    ├── priority.ts      # Priority queue
    ├── cleanup.ts       # Memory management
    └── namespace.ts     # Namespace extraction
```

## Related Components

- CORE-001 (Type System)
- CORE-002 (Table Interfaces)
- CORE-003 (Column Interfaces)
- CORE-004 (Row Interfaces)

## Future Enhancements

Planned improvements:

1. Throttle middleware
2. Event replay for debugging
3. Visual event flow in DevTools
4. Performance profiling integration
5. WebSocket event synchronization