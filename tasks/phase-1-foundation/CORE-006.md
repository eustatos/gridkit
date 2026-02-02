task_id: CORE-006
epic_id: EPIC-FOUNDATION
module: @gridkit/core
file: src/events/types.ts
priority: P0
complexity: low
estimated_tokens: ~8,000
assignable_to_ai: yes
dependencies:

- CORE-001
  guidelines:
- .github/AI_GUIDELINES.md
- .github/AI_SYSTEM_PROMPT.md
- docs/architecture/ARCHITECTURE.md

---

# Task: Event System Type Definitions

## Context

Event interfaces are the foundation for GridKit's event-driven architecture. These types enable:

- Type-safe event emission and subscription
- Plugin integration through event hooks
- DevTools debugging support
- State change notifications
- Lifecycle management

This task defines the core event system types that will be used by CORE-012 (Event System implementation) and throughout the entire library for features like sorting, filtering, state updates, and plugin lifecycle.

## Guidelines Reference

Before implementing, review:

- `.github/AI_GUIDELINES.md` - Code standards for AI (mandatory)
- `.github/AI_SYSTEM_PROMPT.md` - Your role and responsibilities
- `CONTRIBUTING.md` - General contributing rules
- `docs/architecture/ARCHITECTURE.md` - Section 4.3 (Event System)
- `specs/api-specs/core.md` - Core module API specification

## Objectives

- [ ] Define event type hierarchy and naming conventions
- [ ] Create type-safe event payload interfaces
- [ ] Define event listener and handler types
- [ ] Implement event bubbling and cancellation types
- [ ] Support both sync and async event handlers
- [ ] Enable debug mode integration types
- [ ] Ensure full TypeScript strict mode compliance
- [ ] Document all types with comprehensive JSDoc

---

## Implementation Requirements

### 1. Base Event Types

**Expected interface:**

````typescript
/**
 * Base event type identifier.
 * All event types in GridKit follow the pattern: [module]:[action]
 *
 * @example
 * ```typescript
 * type StateUpdateEvent = 'state:update';
 * type DataLoadEvent = 'data:load';
 * type ColumnResizeEvent = 'column:resize';
 * ```
 *
 * @public
 */
export type EventType = string;

/**
 * Base event interface that all events must extend.
 * Provides common properties for event handling and debugging.
 *
 * @template TType - The specific event type identifier
 *
 * @example
 * ```typescript
 * interface DataLoadEvent extends BaseEvent<'data:load'> {
 *   payload: {
 *     data: unknown[];
 *     timestamp: number;
 *   };
 * }
 * ```
 *
 * @public
 */
export interface BaseEvent<TType extends EventType = EventType> {
  /**
   * Event type identifier (e.g., 'state:update', 'data:load')
   */
  type: TType;

  /**
   * Timestamp when the event was created (milliseconds since epoch)
   */
  timestamp: number;

  /**
   * Whether the event can be cancelled
   * @default false
   */
  cancelable?: boolean;

  /**
   * Whether the event bubbles up to parent elements
   * @default true
   */
  bubbles?: boolean;

  /**
   * Additional metadata for debugging
   */
  meta?: EventMeta;
}

/**
 * Event metadata for debugging and tracing.
 *
 * @public
 */
export interface EventMeta {
  /**
   * Source component/module that emitted the event
   */
  source?: string;

  /**
   * Trace ID for distributed debugging
   */
  traceId?: string;

  /**
   * Additional debug information
   */
  debug?: Record<string, unknown>;
}
````

**Implementation guidance:**

- Use string literal types for event type identifiers
- Follow naming convention: `[module]:[action]`
- Timestamp should be `Date.now()` by default
- All events must extend `BaseEvent`

---

### 2. Event Listener Types

**Expected interface:**

````typescript
/**
 * Event listener function signature.
 *
 * @template TEvent - The event type being handled
 *
 * @param event - The event object
 * @returns void or Promise<void> for async handlers
 *
 * @example
 * ```typescript
 * const listener: EventListener<StateUpdateEvent> = (event) => {
 *   console.log('State updated:', event.payload.newState);
 * };
 * ```
 *
 * @public
 */
export type EventListener<TEvent extends BaseEvent = BaseEvent> = (
  event: TEvent
) => void | Promise<void>;

/**
 * Unsubscribe function returned by event subscription.
 * Call this function to remove the event listener.
 *
 * @example
 * ```typescript
 * const unsubscribe = emitter.on('state:update', listener);
 * // Later...
 * unsubscribe();
 * ```
 *
 * @public
 */
export type Unsubscribe = () => void;

/**
 * Event handler options for advanced control.
 *
 * @public
 */
export interface EventHandlerOptions {
  /**
   * Handler will be called only once, then automatically removed
   * @default false
   */
  once?: boolean;

  /**
   * Handler priority (higher values execute first)
   * @default 0
   */
  priority?: number;

  /**
   * Whether to capture the event in the capture phase
   * @default false
   */
  capture?: boolean;

  /**
   * Maximum execution time in milliseconds (for debugging)
   */
  timeout?: number;
}
````

**Implementation guidance:**

- Support both sync and async listeners
- `Unsubscribe` must be idempotent (safe to call multiple times)
- Priority should support negative values
- Timeout is for debug warnings, not enforcement

---

### 3. Core Event Definitions

**Expected interface:**

```typescript
/**
 * State update event payload.
 * Emitted whenever table state changes.
 *
 * @template TData - The row data type
 *
 * @public
 */
export interface StateUpdateEvent<
  TData extends RowData = RowData,
> extends BaseEvent<'state:update'> {
  payload: {
    /**
     * Previous state (immutable)
     */
    previousState: TableState<TData>;

    /**
     * New state (immutable)
     */
    newState: TableState<TData>;

    /**
     * Keys that changed (for optimization)
     */
    changedKeys: Array<keyof TableState<TData>>;
  };
}

/**
 * Data load event payload.
 * Emitted when data is loaded or refreshed.
 *
 * @template TData - The row data type
 *
 * @public
 */
export interface DataLoadEvent<
  TData extends RowData = RowData,
> extends BaseEvent<'data:load'> {
  payload: {
    /**
     * Loaded data
     */
    data: TData[];

    /**
     * Total count (may differ from data.length if paginated)
     */
    totalCount?: number;

    /**
     * Loading source identifier
     */
    source: 'initial' | 'refresh' | 'provider' | 'manual';
  };
}

/**
 * Data change event payload.
 * Emitted when data is modified (add/update/delete).
 *
 * @template TData - The row data type
 *
 * @public
 */
export interface DataChangeEvent<
  TData extends RowData = RowData,
> extends BaseEvent<'data:change'> {
  payload: {
    /**
     * Type of change
     */
    changeType: 'add' | 'update' | 'delete' | 'bulk';

    /**
     * Affected row IDs
     */
    rowIds: RowId[];

    /**
     * New data (for add/update)
     */
    data?: TData[];

    /**
     * Previous data (for update/delete)
     */
    previousData?: TData[];
  };
}

/**
 * Column resize event payload.
 * Emitted when a column is resized.
 *
 * @public
 */
export interface ColumnResizeEvent extends BaseEvent<'column:resize'> {
  payload: {
    /**
     * Column ID being resized
     */
    columnId: ColumnId;

    /**
     * Previous width in pixels
     */
    previousWidth: number;

    /**
     * New width in pixels
     */
    newWidth: number;

    /**
     * Resize source
     */
    source: 'user' | 'auto-fit' | 'programmatic';
  };
}

/**
 * Row selection change event payload.
 * Emitted when row selection changes.
 *
 * @public
 */
export interface RowSelectionEvent extends BaseEvent<'row:select'> {
  payload: {
    /**
     * Row IDs that were added to selection
     */
    added: RowId[];

    /**
     * Row IDs that were removed from selection
     */
    removed: RowId[];

    /**
     * Current selection state
     */
    current: Record<RowId, boolean>;
  };
}

/**
 * Filter change event payload.
 * Emitted when filters are applied or changed.
 *
 * @public
 */
export interface FilterChangeEvent extends BaseEvent<'filter:change'> {
  payload: {
    /**
     * Previous filter state
     */
    previousFilters: unknown; // Will be properly typed in FILTER-001

    /**
     * New filter state
     */
    newFilters: unknown;

    /**
     * Number of rows before filtering
     */
    totalRows: number;

    /**
     * Number of rows after filtering
     */
    filteredRows: number;
  };
}
```

**Implementation guidance:**

- Use strict generic constraints
- All payloads should be immutable
- Include source information for debugging
- changedKeys optimization for state updates

---

### 4. Event Map Type

**Expected interface:**

````typescript
/**
 * Map of all core event types to their event interfaces.
 * Used for type-safe event emission and subscription.
 *
 * @template TData - The row data type
 *
 * @example
 * ```typescript
 * // Type-safe event emission
 * emitter.emit<CoreEventMap<User>>('state:update', stateUpdatePayload);
 *
 * // Type-safe subscription
 * emitter.on<CoreEventMap<User>>('data:load', (event) => {
 *   // event.payload is correctly typed as DataLoadEvent['payload']
 * });
 * ```
 *
 * @public
 */
export interface CoreEventMap<TData extends RowData = RowData> {
  'state:update': StateUpdateEvent<TData>;
  'data:load': DataLoadEvent<TData>;
  'data:change': DataChangeEvent<TData>;
  'column:resize': ColumnResizeEvent;
  'row:select': RowSelectionEvent;
  'filter:change': FilterChangeEvent;
}

/**
 * Extract event type from event map.
 *
 * @template TEventMap - The event map
 * @template TType - The event type key
 *
 * @public
 */
export type ExtractEvent<
  TEventMap extends Record<EventType, BaseEvent>,
  TType extends keyof TEventMap,
> = TEventMap[TType];
````

**Implementation guidance:**

- EventMap should be extensible for plugins
- Use mapped types for type safety
- Support generic event data types

---

### 5. Event Emitter Interface

**Expected interface:**

````typescript
/**
 * Event emitter interface for type-safe event handling.
 *
 * @template TEventMap - Map of event types to event interfaces
 *
 * @example
 * ```typescript
 * const emitter: EventEmitter<CoreEventMap<User>> = createEventEmitter();
 *
 * emitter.on('state:update', (event) => {
 *   // event is typed as StateUpdateEvent<User>
 *   console.log(event.payload.newState);
 * });
 *
 * emitter.emit('data:load', {
 *   type: 'data:load',
 *   timestamp: Date.now(),
 *   payload: { data: users, source: 'initial' }
 * });
 * ```
 *
 * @public
 */
export interface EventEmitter<
  TEventMap extends Record<EventType, BaseEvent> = Record<EventType, BaseEvent>,
> {
  /**
   * Subscribe to an event.
   *
   * @param type - Event type to listen for
   * @param listener - Event handler function
   * @param options - Handler options
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = emitter.on('state:update', (event) => {
   *   console.log('State changed');
   * });
   * ```
   */
  on<TType extends keyof TEventMap>(
    type: TType,
    listener: EventListener<TEventMap[TType]>,
    options?: EventHandlerOptions
  ): Unsubscribe;

  /**
   * Subscribe to an event once (auto-unsubscribe after first call).
   *
   * @param type - Event type to listen for
   * @param listener - Event handler function
   * @returns Unsubscribe function
   */
  once<TType extends keyof TEventMap>(
    type: TType,
    listener: EventListener<TEventMap[TType]>
  ): Unsubscribe;

  /**
   * Unsubscribe from an event.
   *
   * @param type - Event type to stop listening for
   * @param listener - The listener to remove
   */
  off<TType extends keyof TEventMap>(
    type: TType,
    listener: EventListener<TEventMap[TType]>
  ): void;

  /**
   * Emit an event to all subscribers.
   *
   * @param type - Event type to emit
   * @param event - Event object
   * @returns Promise that resolves when all listeners complete
   *
   * @throws {GridKitError} If event is cancelled by a listener
   */
  emit<TType extends keyof TEventMap>(
    type: TType,
    event: TEventMap[TType]
  ): Promise<void>;

  /**
   * Remove all listeners for a specific event type.
   * If no type specified, removes all listeners.
   *
   * @param type - Optional event type
   */
  removeAllListeners<TType extends keyof TEventMap>(type?: TType): void;

  /**
   * Get the number of listeners for an event type.
   *
   * @param type - Event type
   * @returns Number of active listeners
   */
  listenerCount<TType extends keyof TEventMap>(type: TType): number;

  /**
   * Get all registered event types.
   *
   * @returns Array of event type identifiers
   */
  eventTypes(): Array<keyof TEventMap>;
}
````

**Implementation guidance:**

- All methods should be type-safe
- Support both sync and async emission
- Emit should handle errors gracefully
- listenerCount useful for debugging

---

### 6. Event Cancellation

**Expected interface:**

````typescript
/**
 * Error thrown when an event is cancelled.
 *
 * @public
 */
export class EventCancelledError extends Error {
  /**
   * The event that was cancelled
   */
  public readonly event: BaseEvent;

  /**
   * Reason for cancellation
   */
  public readonly reason?: string;

  constructor(event: BaseEvent, reason?: string) {
    super(`Event '${event.type}' was cancelled${reason ? `: ${reason}` : ''}`);
    this.name = 'EventCancelledError';
    this.event = event;
    this.reason = reason;
  }
}

/**
 * Event cancellation interface.
 * Passed to event listeners to allow cancellation.
 *
 * @example
 * ```typescript
 * emitter.on('data:load', (event, cancel) => {
 *   if (invalidData) {
 *     cancel('Invalid data format');
 *   }
 * });
 * ```
 *
 * @public
 */
export interface EventCancellation {
  /**
   * Cancel the event with optional reason.
   *
   * @param reason - Reason for cancellation
   * @throws {Error} If event is not cancelable
   */
  cancel(reason?: string): void;

  /**
   * Whether the event has been cancelled
   */
  readonly cancelled: boolean;
}
````

**Implementation guidance:**

- Only cancelable events can be cancelled
- Cancellation should stop event propagation
- Include reason for debugging

---

## Test Requirements

Create `__tests__/events/types.test.ts`:

```typescript
import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  EventType,
  BaseEvent,
  EventListener,
  Unsubscribe,
  StateUpdateEvent,
  DataLoadEvent,
  EventEmitter,
  CoreEventMap,
  EventCancelledError,
} from '../events/types';

describe('Event Types', () => {
  describe('BaseEvent', () => {
    it('should have required properties', () => {
      const event: BaseEvent<'test:event'> = {
        type: 'test:event',
        timestamp: Date.now(),
      };

      expect(event.type).toBe('test:event');
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should support optional properties', () => {
      const event: BaseEvent = {
        type: 'test',
        timestamp: Date.now(),
        cancelable: true,
        bubbles: false,
        meta: { source: 'test' },
      };

      expect(event.cancelable).toBe(true);
      expect(event.bubbles).toBe(false);
      expect(event.meta?.source).toBe('test');
    });
  });

  describe('Type Inference', () => {
    it('should infer event listener type from event', () => {
      const listener: EventListener<StateUpdateEvent> = (event) => {
        expectTypeOf(event.type).toEqualTypeOf<'state:update'>();
        expectTypeOf(event.payload.newState).toBeObject();
      };

      expect(listener).toBeDefined();
    });

    it('should infer correct payload type', () => {
      const event: DataLoadEvent<{ id: number }> = {
        type: 'data:load',
        timestamp: Date.now(),
        payload: {
          data: [{ id: 1 }],
          source: 'initial',
        },
      };

      expectTypeOf(event.payload.data).toEqualTypeOf<Array<{ id: number }>>();
    });
  });

  describe('CoreEventMap', () => {
    it('should map event types correctly', () => {
      type EventMap = CoreEventMap<{ id: number }>;

      expectTypeOf<EventMap['state:update']>().toEqualTypeOf<
        StateUpdateEvent<{ id: number }>
      >();
      expectTypeOf<EventMap['data:load']>().toEqualTypeOf<
        DataLoadEvent<{ id: number }>
      >();
    });
  });

  describe('EventEmitter Interface', () => {
    it('should enforce type-safe event handling', () => {
      type TestEmitter = EventEmitter<CoreEventMap<{ id: number }>>;

      const emitter = {} as TestEmitter;

      // Should accept correct event type
      const unsub = emitter.on('state:update', (event) => {
        expectTypeOf(event).toEqualTypeOf<StateUpdateEvent<{ id: number }>>();
      });

      expectTypeOf(unsub).toEqualTypeOf<Unsubscribe>();
    });
  });

  describe('EventCancelledError', () => {
    it('should create error with event and reason', () => {
      const event: BaseEvent = {
        type: 'test',
        timestamp: Date.now(),
      };

      const error = new EventCancelledError(event, 'Test reason');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('EventCancelledError');
      expect(error.event).toBe(event);
      expect(error.reason).toBe('Test reason');
      expect(error.message).toContain('Test reason');
    });
  });
});
```

---

## Edge Cases to Handle

- [ ] Empty event type strings (should fail type checking)
- [ ] Null/undefined event properties
- [ ] Async listener errors (should not break other listeners)
- [ ] Cancelling non-cancelable events (should throw)
- [ ] Multiple cancellations of same event
- [ ] Event listener called after unsubscribe
- [ ] Circular event emission (potential stack overflow)
- [ ] Very large number of listeners (performance)

---

## Performance Requirements

- Type checking: Compile-time only (zero runtime cost)
- Event object creation: < 1ms
- No runtime overhead from TypeScript types
- Event map lookup: O(1)

---

## Files to Create/Modify

- [ ] `src/events/types.ts` - Event type definitions (NEW)
- [ ] `src/events/index.ts` - Exports (NEW)
- [ ] `src/types/index.ts` - Re-export event types (MODIFY)
- [ ] `__tests__/events/types.test.ts` - Type tests (NEW)

---

## Success Criteria

- [ ] All type definitions compile with strict mode
- [ ] 100% test coverage for type assertions
- [ ] TypeScript inference works in IDE
- [ ] No `any` types used
- [ ] All types have comprehensive JSDoc
- [ ] Event naming follows `[module]:[action]` pattern
- [ ] Generic constraints properly applied
- [ ] Type tests verify inference behavior

---

## Related Tasks

- **Depends on:** CORE-001 (Base TypeScript Types)
- **Blocks:** CORE-012 (Event System Implementation)
- **Blocks:** PLUGIN-001 (Plugin Registry)
- **Blocks:** STATE-001 (State Management)
- **Related:** CORE-005 (State Interfaces)

---

## Self-Check (Before marking complete)

Review `.github/AI_GUIDELINES.md` Section 9: Code Review Checklist

- [ ] TypeScript strict mode passes with zero errors
- [ ] No `any` types used (searched for `: any`)
- [ ] Explicit return types for all public exports
- [ ] Named exports only (no `export default`)
- [ ] Type tests written for all generic types
- [ ] No prohibited patterns (mutations, implicit any, etc.)
- [ ] JSDoc comments complete with examples
- [ ] Follows event naming conventions
- [ ] Generic constraints applied correctly
- [ ] Event map extensibility considered

---

## Notes for AI

### Event Naming Convention

Follow the pattern: `[module]:[action]`

**Examples:**

- `state:update` - State changed
- `data:load` - Data loaded
- `data:change` - Data modified
- `column:resize` - Column resized
- `row:select` - Row selection changed
- `filter:change` - Filters applied

**Core modules:**

- `state` - State management events
- `data` - Data loading/changes
- `column` - Column operations
- `row` - Row operations
- `table` - Table lifecycle

**Plugin modules:**

- `sort` - Sorting events
- `filter` - Filtering events
- `group` - Grouping events
- `edit` - Editing events

### Type Safety Best Practices

1. **Use string literal types for event names:**

   ```typescript
   type: 'state:update'; // Not: type: string
   ```

2. **Leverage generic constraints:**

   ```typescript
   <TData extends RowData = RowData>
   ```

3. **Use mapped types for event maps:**

   ```typescript
   type EventMap = { [K in EventType]: BaseEvent };
   ```

4. **Ensure type inference works:**
   ```typescript
   emitter.on('state:update', (event) => {
     // event should be typed as StateUpdateEvent automatically
   });
   ```

### Common Pitfalls to Avoid

❌ **Don't use any:**

```typescript
payload: any; // NO!
```

✅ **Use unknown with type guards:**

```typescript
payload: unknown; // Validate at runtime
```

❌ **Don't make everything optional:**

```typescript
type?: string; // Only if truly optional
```

✅ **Be explicit about required vs optional:**

```typescript
type: string; // Required
reason?: string; // Optional
```

❌ **Don't forget generic constraints:**

```typescript
<T> // Too loose
```

✅ **Apply proper constraints:**

```typescript
<T extends RowData>
```

### Reference Implementation Hints

Look at these for inspiration:

- Node.js EventEmitter types
- RxJS Observable types
- DOM Event types

But keep GridKit-specific:

- Immutable payloads
- Debug metadata
- Plugin extensibility
- Performance tracking

---

## Additional Context

This task is part of **Phase 1: Foundation** and is critical for:

1. Event-driven state management
2. Plugin lifecycle hooks
3. DevTools integration
4. Real-time debugging

The event system will be the backbone of communication between:

- Core table and plugins
- State manager and UI
- Data providers and table
- DevTools and runtime

Keep it simple, type-safe, and performant!
