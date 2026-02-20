---
task_id: REACT-007
epic_id: EPIC-REACT
module: @gridkit/react
file: src/hooks/useTableEvents.ts
priority: P0
complexity: medium
estimated_tokens: ~9,000
assignable_to_ai: yes
dependencies:
  - REACT-005
guidelines:
  - .github/AI_GUIDELINES.md
---

# Task: Implement useTableEvents Hook

## Context

Create hooks for subscribing to table events in a React-friendly way. This enables components to react to table events (state changes, user interactions, etc.) with automatic cleanup.

## Objectives

- [ ] Create useTableEvents hook for event subscription
- [ ] Support event filtering and throttling
- [ ] Handle cleanup automatically
- [ ] Provide type-safe event handlers
- [ ] Support multiple event types

---

## Implementation Requirements

### 1. Core Hook Implementation

Create `src/hooks/useTableEvents.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import type { Table, GridEvent, EventHandler, RowData } from '@gridkit/core';

/**
 * Options for event subscription
 */
export interface UseEventOptions {
  /**
   * Enable/disable the subscription
   */
  enabled?: boolean;
  
  /**
   * Debounce delay in milliseconds
   */
  debounce?: number;
  
  /**
   * Throttle delay in milliseconds
   */
  throttle?: number;
  
  /**
   * Only trigger once
   */
  once?: boolean;
}

/**
 * Hook to subscribe to table events
 * 
 * @param table - Table instance
 * @param eventType - Event type to subscribe to
 * @param handler - Event handler function
 * @param options - Subscription options
 * 
 * @example
 * ```tsx
 * useTableEvent(table, 'state:update', (event) => {
 *   console.log('State updated:', event.payload);
 * });
 * ```
 */
export function useTableEvent<TData extends RowData>(
  table: Table<TData>,
  eventType: string,
  handler: EventHandler,
  options: UseEventOptions = {}
): void {
  const {
    enabled = true,
    debounce,
    throttle,
    once = false,
  } = options;
  
  // Store handler in ref to avoid re-subscribing
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  
  // Debounced/throttled handler
  const processedHandler = useCallback(
    (event: GridEvent) => {
      handlerRef.current(event);
    },
    []
  );
  
  useEffect(() => {
    if (!enabled) return;
    
    let timeoutId: NodeJS.Timeout | null = null;
    let lastCallTime = 0;
    
    const wrappedHandler: EventHandler = (event) => {
      if (debounce) {
        // Debounce: delay execution
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => processedHandler(event), debounce);
      } else if (throttle) {
        // Throttle: limit execution rate
        const now = Date.now();
        if (now - lastCallTime >= throttle) {
          lastCallTime = now;
          processedHandler(event);
        }
      } else {
        // No delay
        processedHandler(event);
      }
    };
    
    const unsubscribe = table.on(eventType, wrappedHandler, { once });
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [table, eventType, enabled, debounce, throttle, once, processedHandler]);
}

/**
 * Hook to subscribe to multiple events
 */
export function useTableEvents<TData extends RowData>(
  table: Table<TData>,
  events: Record<string, EventHandler>,
  options: UseEventOptions = {}
): void {
  const eventEntries = Object.entries(events);
  
  useEffect(() => {
    if (!options.enabled && options.enabled !== undefined) return;
    
    const unsubscribers = eventEntries.map(([eventType, handler]) => {
      return table.on(eventType, handler, { once: options.once });
    });
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [table, options.enabled, options.once, ...eventEntries.map(([type]) => type)]);
}

/**
 * Hook to subscribe to state change events
 */
export function useTableStateChange<TData extends RowData>(
  table: Table<TData>,
  handler: (state: any) => void,
  options: UseEventOptions = {}
): void {
  useTableEvent(
    table,
    'state:update',
    (event) => {
      handler(event.payload);
    },
    options
  );
}

/**
 * Hook to subscribe to row selection events
 */
export function useRowSelection<TData extends RowData>(
  table: Table<TData>,
  handler: (selectedRows: any[]) => void,
  options: UseEventOptions = {}
): void {
  useTableEvent(
    table,
    'row:select',
    (event) => {
      handler(event.payload);
    },
    options
  );
}
```

### 2. Export Hooks

Update `src/hooks/index.ts`:

```typescript
export * from './useTable';
export * from './useTableState';
export {
  useTableEvent,
  useTableEvents,
  useTableStateChange,
  useRowSelection,
} from './useTableEvents';
export type { UseEventOptions } from './useTableEvents';
```

---

## Test Requirements

Create `src/hooks/__tests__/useTableEvents.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTable } from '../useTable';
import { useTableEvent, useTableStateChange } from '../useTableEvents';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('useTableEvents', () => {
  it('should subscribe to events', async () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const handler = vi.fn();
    
    renderHook(() =>
      useTableEvent(tableResult.current.table, 'state:update', handler)
    );
    
    // Trigger event
    tableResult.current.table.setState((prev) => ({
      ...prev,
      sorting: [{ id: 'name', desc: true }],
    }));
    
    await waitFor(() => {
      expect(handler).toHaveBeenCalled();
    });
  });
  
  it('should cleanup on unmount', () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const handler = vi.fn();
    
    const { unmount } = renderHook(() =>
      useTableEvent(tableResult.current.table, 'state:update', handler)
    );
    
    unmount();
    
    // Event after unmount should not trigger handler
    tableResult.current.table.setState((prev) => ({
      ...prev,
      sorting: [{ id: 'name', desc: true }],
    }));
    
    expect(handler).not.toHaveBeenCalled();
  });
  
  it('should support debounce', async () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );
    
    const handler = vi.fn();
    
    renderHook(() =>
      useTableEvent(tableResult.current.table, 'state:update', handler, {
        debounce: 100,
      })
    );
    
    // Trigger multiple events quickly
    tableResult.current.table.setState((prev) => ({ ...prev, sorting: [{ id: 'a', desc: true }] }));
    tableResult.current.table.setState((prev) => ({ ...prev, sorting: [{ id: 'b', desc: true }] }));
    tableResult.current.table.setState((prev) => ({ ...prev, sorting: [{ id: 'c', desc: true }] }));
    
    await waitFor(() => {
      // Should only be called once due to debounce
      expect(handler).toHaveBeenCalledTimes(1);
    }, { timeout: 200 });
  });
});
```

---

## Files to Create/Modify

- [ ] `src/hooks/useTableEvents.ts` - Implementation
- [ ] `src/hooks/__tests__/useTableEvents.test.tsx` - Tests
- [ ] `src/hooks/index.ts` - Exports

---

## Success Criteria

- [ ] Event subscription works
- [ ] Cleanup on unmount
- [ ] Debounce/throttle work
- [ ] Type-safe handlers
- [ ] All tests pass

---

## Notes for AI

- Use useEffect for subscriptions
- Store handler in ref to avoid re-subscribing
- Implement debounce/throttle
- Cleanup subscriptions properly
- Support multiple event types
