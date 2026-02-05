# CORE-005D: Middleware System & Event Pipeline

## 🎯 Goal

Implement a flexible middleware system for event interception, transformation, and cancellation with a compiled pipeline for optimal performance.

## 📋 What to implement

### 1. Middleware Architecture

- Define `EventMiddleware` interface: `(event) => event | null`
- Implement middleware chain with order preservation
- Support event modification, filtering, and cancellation
- Add middleware metadata for debugging and prioritization

### 2. Compiled Pipeline System

- Create `EventPipeline` class that compiles middleware chain
- Implement ahead-of-time compilation for hot paths
- Support dynamic middleware addition/removal with recompilation
- Add pipeline instrumentation for performance monitoring

### 3. Built-in Middleware

- `LoggingMiddleware`: Structured event logging with levels
- `ValidationMiddleware`: Payload validation against schemas
- `DebounceMiddleware`: Event rate limiting
- `ThrottleMiddleware`: Event frequency limiting
- `FilterMiddleware`: Conditional event processing

### 4. Middleware Context & Utilities

- `EventContext` with cancellation support
- `MiddlewareResult` types for typed returns
- Utility functions for common middleware patterns
- Middleware composition helpers (`composeMiddlewares`)

## 🚫 What NOT to do

- Do NOT implement plugin-specific middleware
- Do NOT add complex transformation logic
- Do NOT implement persistent middleware state
- Keep middleware stateless and pure where possible

## 📁 File Structure

```
packages/core/src/events/middleware/
├── core/
│   ├── EventPipeline.ts     # Compiled pipeline system
│   ├── MiddlewareChain.ts   # Middleware chain management
│   └── MiddlewareContext.ts # Execution context
├── builtin/
│   ├── LoggingMiddleware.ts
│   ├── ValidationMiddleware.ts
│   ├── DebounceMiddleware.ts
│   ├── ThrottleMiddleware.ts
│   └── FilterMiddleware.ts
├── utils/
│   ├── compose.ts           # Middleware composition
│   ├── helpers.ts           # Utility functions
│   └── types.ts             # Middleware types
└── MiddlewareEventBus.ts    # EventBus with middleware support
```

## 🧪 Test Requirements

- [ ] Middleware chain: Execution in correct order
- [ ] Event modification: Middleware can modify event payload
- [ ] Event cancellation: Middleware can cancel events
- [ ] Pipeline compilation: No runtime overhead after compilation
- [ ] Dynamic middleware: Add/remove at runtime works
- [ ] Built-in middleware: All built-in middleware functions correctly
- [ ] Error handling: Middleware errors don't break pipeline
- [ ] Performance: < 0.01ms overhead per middleware

## 💡 Implementation Example

```typescript
// middleware/core/EventPipeline.ts
export class EventPipeline {
  private middlewares: EventMiddleware[] = [];
  private compiled: EventMiddleware | null = null;
  private isDirty = true;

  use(middleware: EventMiddleware): () => void {
    this.middlewares.push(middleware);
    this.isDirty = true;
    return () => this.remove(middleware);
  }

  process(event: GridEvent): GridEvent | null {
    if (this.isDirty) {
      this.compile();
    }
    return this.compiled!(event);
  }

  private compile(): void {
    // Compile middleware chain into single function
    const chain = this.middlewares.reduceRight(
      (next, middleware) => (e) => {
        const result = middleware(e);
        return result === null ? null : next(result);
      },
      (e: GridEvent) => e
    );

    this.compiled = chain;
    this.isDirty = false;
  }
}

// middleware/builtin/DebounceMiddleware.ts
export function createDebounceMiddleware(
  delay: number,
  options?: { leading?: boolean }
): EventMiddleware {
  const timers = new Map<string, NodeJS.Timeout>();
  const leadingExecuted = new Set<string>();

  return (event: GridEvent) => {
    const key = event.type;

    if (options?.leading && !leadingExecuted.has(key)) {
      leadingExecuted.add(key);
      return event;
    }

    if (timers.has(key)) {
      clearTimeout(timers.get(key)!);
    }

    return null; // Cancel this event
  };
}
```

## 🔗 Dependencies

- CORE-005A (Event System Foundation) - Required
- CORE-005C (Priority Scheduling) - Optional, but recommended
- TypeScript 4.5+ for conditional and mapped types

## 📊 Success Criteria

- Middleware overhead < 10μs per middleware
- Zero memory leaks with dynamic middleware
- 100% type safety for middleware composition
- All built-in middleware tested with edge cases
- Pipeline compilation eliminates runtime loops
