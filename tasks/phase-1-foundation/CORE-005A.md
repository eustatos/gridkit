# CORE-005A: Event System Foundation - Core Types & Base Implementation

## 🎯 Goal

Establish the foundational event system with type-safe event definitions and a basic event bus implementation that will serve as the backbone for GridKit's plugin architecture.

## 📋 What to implement

### 1. Core Type System

- Define `GridEvent`, `EventHandler`, `EventSubscription` interfaces
- Create `EventPriority` enum with IMMEDIATE/HIGH/NORMAL/LOW levels
- Implement `EventRegistry` with 10-15 essential event types (grid lifecycle, basic row/column operations)
- Set up branded type integration with `GridId`, `ColumnId`, `RowId`

### 2. Minimal EventBus

- Implement `on()`, `once()`, `off()`, `emit()` methods
- Add `clear()` for cleanup
- Support basic priority handling (synchronous execution only in this phase)
- Memory-safe handler storage with WeakRef support

### 3. Type Safety Infrastructure

- Type-safe event emission with compile-time payload validation
- Event type inference from registry
- Namespace extraction utilities
- Module augmentation support for custom events

## 🚫 What NOT to do

- Do NOT implement middleware system
- Do NOT add advanced optimizations (batching, debouncing, JIT)
- Do NOT implement async event handling
- Do NOT add DevTools integration
- Keep it under 300 lines of core implementation code

## 📁 File Structure

```
packages/core/src/events/
├── types/
│   ├── base.ts              # Base interfaces & enums
│   ├── registry.ts          # Core event registry
│   └── index.ts             # Type exports
├── EventBus.ts              # Core EventBus implementation
├── utils/
│   ├── namespace.ts         # Namespace extraction
│   └── cleanup.ts           # Basic cleanup utilities
└── index.ts                 # Public API
```

## 🧪 Test Requirements

- [ ] Type safety: Compile-time validation of event payloads
- [ ] Basic pub/sub: on() and emit() work correctly
- [ ] Unsubscription: off() removes handlers
- [ ] Once handlers: Auto-remove after first call
- [ ] Memory: No leaks after clear()
- [ ] Priority: IMMEDIATE executes synchronously

## 💡 Implementation Example

```typescript
// types/base.ts - Only interfaces, no implementation
export enum EventPriority {
  IMMEDIATE = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
}

export interface GridEvent<T = unknown> {
  readonly type: string;
  readonly payload: T;
  readonly timestamp: number;
}

// EventBus.ts - Simple implementation pattern
export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on<T extends EventType>(event: T, handler: EventHandler<T>): () => void {
    // AI implements this
  }

  emit<T extends EventType>(event: T, payload: EventPayload<T>): void {
    // AI implements this
  }
}
```

## 🔗 Dependencies

- CORE-001 (Type System) - Required for branded types
- CORE-002 (Table Interfaces) - Basic types only
- CORE-003 (Column Interfaces) - Basic types only
- CORE-004 (Row Interfaces) - Basic types only

## 📊 Success Criteria

- < 2KB gzipped bundle size
- < 0.1ms emit time (cold path)
- 100% type coverage in strict mode
- Zero runtime type assertions (`as any`)
