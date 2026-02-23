# ENT-EVT-001: Event System Enhancement

**Status**: 🟢 Ready  
**Priority**: P0 - Critical  
**Estimated Effort**: 3 weeks  
**Phase**: 1 - Core Enhancement  
**Dependencies**: Existing event system (CORE-013)

---

## Objective

Enhance the existing event system to provide best-in-class event-driven API with declarative middleware support, making it superior to TanStack Table's callback-based approach.

---

## Current State (TanStack Table)

```typescript
// ❌ Manual event handling
useEffect(() => {
  const subscription = table.options.onStateChange?.(state)
  // Manual logic for each event type
}, [table])
```

---

## Target State (GridKit Enhanced)

```typescript
// ✅ Declarative event system with middleware
table.on('row:select', (event) => {
  console.log('Row selected:', event.payload.rowId)
  analytics.track('row_selected', { rowId: event.payload.rowId })
})

table.on('sorting:change', debounce((event) => {
  api.saveUserPreferences(event.payload.sorting)
}, 300))

// Middleware composition
table.use(
  createLoggingMiddleware({ logger: customLogger }),
  createDebounceMiddleware({ wait: 300 }),
  createValidationMiddleware({ schema: eventSchema })
)
```

---

## Technical Requirements

### 1. Enhanced Event Types

**File**: `packages/core/src/events/types/enhanced.ts`

```typescript
export interface EnhancedEventPayload {
  timestamp: number
  source: string
  metadata?: Record<string, unknown>
  correlationId?: string
}

export interface RowSelectEvent extends EnhancedEventPayload {
  type: 'row:select'
  payload: {
    rowId: string
    rowIndex: number
    row: Row<any>
    selected: boolean
  }
}

export interface SortingChangeEvent extends EnhancedEventPayload {
  type: 'sorting:change'
  payload: {
    sorting: SortingState
    previousSorting: SortingState
    changedColumn?: string
  }
}

export interface FilteringChangeEvent extends EnhancedEventPayload {
  type: 'filtering:change'
  payload: {
    filtering: FilteringState
    previousFiltering: FilteringState
    rowCount: number
  }
}

export type EnhancedTableEvent = 
  | RowSelectEvent 
  | SortingChangeEvent 
  | FilteringChangeEvent
  // ... more events
```

### 2. Middleware System Enhancement

**File**: `packages/core/src/events/middleware/enhanced/index.ts`

```typescript
export interface EnhancedMiddleware<T extends BaseEvent = BaseEvent> {
  name: string
  version: string
  priority?: number
  
  handle(
    event: T,
    context: MiddlewareContext,
    next: () => Promise<void>
  ): Promise<void>
  
  initialize?(): Promise<void>
  destroy?(): Promise<void>
}

// Factory functions
export function createLoggingMiddleware(options: LoggingOptions): EnhancedMiddleware
export function createDebounceMiddleware(options: DebounceOptions): EnhancedMiddleware
export function createThrottleMiddleware(options: ThrottleOptions): EnhancedMiddleware
export function createValidationMiddleware(options: ValidationOptions): EnhancedMiddleware
export function createAnalyticsMiddleware(options: AnalyticsOptions): EnhancedMiddleware
```

### 3. Event Sourcing Support

**File**: `packages/core/src/events/sourcing/index.ts`

```typescript
export class EventStore {
  private events: EnhancedTableEvent[] = []
  private snapshots: Map<number, TableSnapshot> = new Map()
  
  append(event: EnhancedTableEvent): void
  getEvents(from?: number, to?: number): EnhancedTableEvent[]
  createSnapshot(state: TableState): void
  restoreFromSnapshot(index: number): TableState
  replay(from?: number, to?: number): void
}

export interface TableSnapshot {
  timestamp: number
  eventIndex: number
  state: TableState
  metadata: Record<string, unknown>
}
```

### 4. Enhanced Event Bus

**File**: `packages/core/src/events/EnhancedEventBus.ts`

```typescript
export class EnhancedEventBus extends EventBus {
  private middlewares: EnhancedMiddleware[] = []
  private eventStore?: EventStore
  
  use(...middlewares: EnhancedMiddleware[]): this
  
  enableEventSourcing(options?: EventSourcingOptions): void
  disableEventSourcing(): void
  
  replay(options?: ReplayOptions): void
  
  getEventHistory(filter?: EventFilter): EnhancedTableEvent[]
  
  getMiddlewares(): EnhancedMiddleware[]
  removeMiddleware(name: string): boolean
}
```

### 5. Correlation ID Support

**File**: `packages/core/src/events/correlation/index.ts`

```typescript
export class CorrelationManager {
  private correlationMap: Map<string, EnhancedTableEvent[]> = new Map()
  
  createCorrelation(): string
  addEvent(correlationId: string, event: EnhancedTableEvent): void
  getRelatedEvents(correlationId: string): EnhancedTableEvent[]
  clearCorrelation(correlationId: string): void
}
```

---

## Implementation Plan

### Step 1: Enhanced Event Types
- [ ] Define enhanced event payload structure
- [ ] Add all table event types with proper typing
- [ ] Add metadata and correlation support
- [ ] Write type tests

### Step 2: Middleware Enhancement
- [ ] Create enhanced middleware interface
- [ ] Implement logging middleware
- [ ] Implement debounce middleware
- [ ] Implement throttle middleware
- [ ] Implement validation middleware
- [ ] Implement analytics middleware
- [ ] Add middleware composition utilities

### Step 3: Event Sourcing
- [ ] Implement EventStore
- [ ] Add snapshot support
- [ ] Add replay functionality
- [ ] Add time-travel debugging support

### Step 4: Enhanced Event Bus
- [ ] Extend existing EventBus
- [ ] Add middleware support
- [ ] Add event sourcing integration
- [ ] Add correlation tracking
- [ ] Add event filtering

### Step 5: Integration
- [ ] Integrate with TableInstance
- [ ] Add factory helpers
- [ ] Update existing event emitters
- [ ] Add backward compatibility

### Step 6: Testing
- [ ] Unit tests for all components
- [ ] Integration tests
- [ ] Performance tests
- [ ] E2E tests with middleware chains

### Step 7: Documentation
- [ ] API documentation
- [ ] Usage examples
- [ ] Migration guide
- [ ] Best practices

---

## Testing Strategy

### Unit Tests

```typescript
describe('EnhancedEventBus', () => {
  it('should execute middlewares in order', async () => {
    const bus = new EnhancedEventBus()
    const order: string[] = []
    
    bus.use(
      createMiddleware('first', () => order.push('first')),
      createMiddleware('second', () => order.push('second'))
    )
    
    await bus.emit({ type: 'test' })
    
    expect(order).toEqual(['first', 'second'])
  })
  
  it('should support event sourcing', () => {
    const bus = new EnhancedEventBus()
    bus.enableEventSourcing()
    
    bus.emit({ type: 'row:select', payload: { rowId: '1' } })
    bus.emit({ type: 'row:select', payload: { rowId: '2' } })
    
    const history = bus.getEventHistory()
    expect(history).toHaveLength(2)
  })
})
```

### Integration Tests

```typescript
describe('Event System Integration', () => {
  it('should work with table instance', () => {
    const table = createTable({
      data,
      columns,
      features: {
        events: {
          middleware: [
            createLoggingMiddleware(),
            createDebounceMiddleware({ wait: 100 })
          ],
          eventSourcing: true
        }
      }
    })
    
    const handler = vi.fn()
    table.on('sorting:change', handler)
    
    table.setSorting([{ id: 'name', desc: false }])
    
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'sorting:change',
        payload: expect.objectContaining({
          sorting: [{ id: 'name', desc: false }]
        })
      })
    )
  })
})
```

---

## Performance Requirements

- **Event emission**: < 1ms overhead per event
- **Middleware execution**: < 5ms for 10 middlewares
- **Event store**: < 10ms for append operation
- **Replay**: < 100ms for 1000 events
- **Memory**: < 1MB per 10,000 events

---

## Success Criteria

- ✅ All enhanced event types properly typed
- ✅ Middleware system working with composition
- ✅ Event sourcing functional
- ✅ Correlation tracking working
- ✅ All tests passing (>95% coverage)
- ✅ Performance benchmarks met
- ✅ Documentation complete
- ✅ Backward compatible with existing code

---

## Migration Path

### From Current Events
```typescript
// Before
table.eventBus.on('stateChange', handler)

// After (backward compatible)
table.eventBus.on('stateChange', handler)

// New enhanced way
table.on('state:change', handler)
table.use(createDebounceMiddleware({ wait: 300 }))
```

---

## Use Cases

### 1. Analytics Integration
```typescript
table.use(createAnalyticsMiddleware({
  provider: 'mixpanel',
  eventMap: {
    'row:select': 'Table Row Selected',
    'filter:apply': 'Table Filter Applied'
  }
}))
```

### 2. Audit Logging
```typescript
table.use(createAuditMiddleware({
  destination: 'api/audit-logs',
  events: ['row:create', 'row:update', 'row:delete'],
  includeMetadata: true
}))
```

### 3. State Persistence
```typescript
table.on('state:change', debounce((event) => {
  localStorage.setItem('table-state', JSON.stringify(event.payload.state))
}, 1000))
```

---

## Files to Create/Modify

### New Files
- `packages/core/src/events/types/enhanced.ts`
- `packages/core/src/events/middleware/enhanced/index.ts`
- `packages/core/src/events/middleware/enhanced/logging.ts`
- `packages/core/src/events/middleware/enhanced/debounce.ts`
- `packages/core/src/events/middleware/enhanced/throttle.ts`
- `packages/core/src/events/middleware/enhanced/validation.ts`
- `packages/core/src/events/middleware/enhanced/analytics.ts`
- `packages/core/src/events/sourcing/EventStore.ts`
- `packages/core/src/events/sourcing/index.ts`
- `packages/core/src/events/correlation/CorrelationManager.ts`
- `packages/core/src/events/EnhancedEventBus.ts`
- `packages/core/src/events/__tests__/enhanced.test.ts`

### Modified Files
- `packages/core/src/events/index.ts` (exports)
- `packages/core/src/table/factory/create-table.ts` (integration)
- `packages/core/src/table/instance/TableInstance.ts` (event methods)

---

## References

- [Event System Documentation](../../packages/core/src/events/README.md)
- [Middleware Pattern](../../packages/core/src/events/middleware/README.md)
- [Complementary Benefits](../../docs/COMPLEMENTARY_SOLUTION_BENEFITS.md)

---

**Author**: GridKit Team  
**Created**: 2026-02-23  
**Last Updated**: 2026-02-23
