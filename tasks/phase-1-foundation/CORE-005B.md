# CORE-005B: Complete Event Registry & State Integration

## 🎯 Goal

Expand the event registry with comprehensive event types from CORE-002, CORE-003, CORE-004 and integrate state management events from CORE-006 while maintaining strict type safety.

## 📋 What to implement

### 1. Complete Event Registry

- Add all grid lifecycle events (`grid:init`, `grid:ready`, `grid:destroy`)
- Implement column operations events (`column:add`, `column:resize`, `column:state-change`)
- Add row operations events (`row:add`, `row:update`, `row:state-change`)
- Include cell-level events (`cell:focus`, `cell:update`)
- Add virtualization, sorting, filtering events

### 2. State Management Events (CORE-006 Integration)

- `state:update` - Generic state change events with typed payloads
- `state:transaction` - Atomic state operations
- `state:commit` - State persistence events
- Generic typing with `TableState<TData>` integration

### 3. Modular Type Architecture

- Split registry into modules by domain (grid.ts, column.ts, row.ts, state.ts)
- Type composition for better tree-shaking
- Conditional types for automatic payload inference
- Event cancellation types (`EventCancelledError`, `EventCancellation`)

### 4. Enhanced Type Safety

- Branded type validation in event payloads
- Immutable event interfaces
- Generic constraints for state events
- Compile-time namespace validation

## 🚫 What NOT to do

- Do NOT implement event bus optimizations
- Do NOT add middleware system
- Do NOT implement bulk operations
- Keep implementation focused on type definitions only

## 📁 File Structure

```
packages/core/src/events/types/
├── grid.ts              # Grid lifecycle events
├── column.ts            # Column events (CORE-003)
├── row.ts               # Row events (CORE-004)
├── cell.ts              # Cell-level events
├── state.ts             # State events (CORE-006)
├── table.ts             # Table feature events (CORE-002)
├── composite.ts         # Composite EventRegistry type
└── index.ts             # Re-export all types
```

## 🧪 Test Requirements

- [ ] All event types compile with correct payloads
- [ ] Branded type validation in event payloads
- [ ] Immutability: Event interfaces are readonly
- [ ] Type inference: EventPayload<T> correctly infers payload type
- [ ] Namespace: All events have valid namespace prefixes
- [ ] Generic state events work with any TableState type

## 💡 Type Definition Example

```typescript
// types/state.ts - State management events
export interface StateEventRegistry {
  'state:update': {
    readonly previousState: TableState<any>;
    readonly newState: TableState<any>;
    readonly changedKeys: readonly string[];
    readonly source?: string;
  };

  'state:transaction': {
    readonly transactionId: string;
    readonly operations: readonly StateOperation[];
    readonly metadata?: Record<string, unknown>;
  };
}

// types/composite.ts - Type composition
export type EventRegistry = GridEventRegistry &
  ColumnEventRegistry &
  RowEventRegistry &
  StateEventRegistry &
  TableEventRegistry;
```

## 🔗 Dependencies

- CORE-005A (Event System Foundation) - Required
- CORE-001 (Type System) - Branded types
- CORE-002 (Table Interfaces) - TableState type
- CORE-006 (Plugin System) - State event requirements

## 📊 Success Criteria

- 50+ event types defined with full type safety
- Zero `any` types in event definitions
- All events properly namespaced
- State events generic over `TableState<TData>`
- Full backward compatibility with CORE-005A
