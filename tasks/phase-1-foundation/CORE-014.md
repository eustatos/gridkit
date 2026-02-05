# CORE-014: Event System Integration & Table Event Bridge

## Task Card

```
task_id: CORE-014
priority: P0
complexity: Medium
estimated_tokens: ~10,000
ai_ready: yes (with event-driven architecture)
dependencies: [CORE-001, CORE-002, CORE-005A, CORE-010, CORE-011, CORE-012, CORE-013]
requires_validation: true (event flow consistency)
```

## 🎯 **Objective**

Integrate the event system (CORE-005) with the table instance to create a unified event-driven architecture. Bridge table state changes, user interactions, and plugin communications through a centralized event bus.

## 📋 **Implementation Scope**

### **1. Table Event Bridge Implementation**

```typescript
/**
 * Creates event bridge between table and event system.
 * Translates table operations into events and vice versa.
 */
export function createTableEventBridge<TData extends RowData>(
  table: Table<TData>,
  eventBus: EventBus
): TableEventBridge<TData> {
  const tableId = table.id;

  // 1. Wire up table state changes to events
  const unsubscribeState = table.subscribe((state) => {
    emitStateEvents(state, table, eventBus);
  });

  // 2. Wire up column events
  const columnEventHandlers = setupColumnEvents(table, eventBus);

  // 3. Wire up row events
  const rowEventHandlers = setupRowEvents(table, eventBus);

  // 4. Create bridge instance
  const bridge: TableEventBridge<TData> = {
    // Event emission methods
    emitEvent: <T extends EventType>(event: T, payload: EventPayload<T>) => {
      eventBus.emit(event, {
        ...payload,
        tableId,
        timestamp: Date.now(),
        source: 'table',
      });
    },

    emitStateUpdate: (previousState, newState, changedKeys) => {
      eventBus.emit('state:update', {
        tableId,
        previousState,
        newState,
        changedKeys,
        timestamp: Date.now(),
      });
    },

    emitDataChange: (changeType, rowIds, data, previousData) => {
      eventBus.emit('data:change', {
        tableId,
        changeType,
        rowIds,
        data,
        previousData,
        timestamp: Date.now(),
        source: 'table',
      });
    },

    // Event subscription methods
    on: <T extends EventType>(
      event: T,
      handler: EventHandler<EventPayload<T>>,
      options?: EventHandlerOptions
    ) => eventBus.on(event, handler, options),

    once: <T extends EventType>(
      event: T,
      handler: EventHandler<EventPayload<T>>
    ) => eventBus.once(event, handler),

    off: <T extends EventType>(
      event: T,
      handler: EventHandler<EventPayload<T>>
    ) => eventBus.off(event, handler),

    // Lifecycle
    destroy: () => {
      unsubscribeState();
      columnEventHandlers.destroy();
      rowEventHandlers.destroy();
      eventBus.clear();
    },

    // Metadata
    eventBus,
    tableId,
  };

  // 5. Emit initialization events
  eventBus.emit('table:init', {
    tableId,
    timestamp: Date.now(),
    columnCount: table.getAllColumns().length,
    rowCount: table.getRowModel().rows.length,
  });

  return bridge;
}

/**
 * Emits events based on state changes.
 */
function emitStateEvents<TData>(
  state: TableState<TData>,
  table: Table<TData>,
  eventBus: EventBus
): void {
  // Track previous state for diffs
  let previousState: TableState<TData> | undefined;

  // Emit specific events based on state changes
  const changedKeys = detectChangedKeys(previousState, state);

  if (changedKeys.length > 0) {
    // Emit general state update
    eventBus.emit('state:update', {
      tableId: table.id,
      previousState,
      newState: state,
      changedKeys,
      timestamp: Date.now(),
    });

    // Emit specific events
    if (changedKeys.includes('columnVisibility')) {
      emitColumnVisibilityEvents(previousState!, state, table, eventBus);
    }

    if (changedKeys.includes('rowSelection')) {
      emitRowSelectionEvents(previousState!, state, table, eventBus);
    }

    if (changedKeys.includes('sorting')) {
      emitSortingEvents(previousState!, state, table, eventBus);
    }

    if (changedKeys.includes('filtering')) {
      emitFilteringEvents(previousState!, state, table, eventBus);
    }

    if (changedKeys.includes('expanded')) {
      emitExpansionEvents(previousState!, state, table, eventBus);
    }
  }

  previousState = state;
}
```

### **2. Column Event Integration**

```typescript
/**
 * Sets up column-specific event handlers.
 */
function setupColumnEvents<TData>(
  table: Table<TData>,
  eventBus: EventBus
): ColumnEventHandlers {
  const handlers: Array<() => void> = [];
  const tableId = table.id;

  // Listen to column-specific events
  const columnEventHandlers = {
    // Column resizing
    handleColumnResize: (
      columnId: ColumnId,
      width: number,
      oldWidth: number
    ) => {
      eventBus.emit('column:resize', {
        tableId,
        columnId,
        width,
        oldWidth,
        timestamp: Date.now(),
        source: 'user',
      });
    },

    // Column reordering
    handleColumnReorder: (
      columnId: ColumnId,
      fromIndex: number,
      toIndex: number
    ) => {
      eventBus.emit('column:reorder', {
        tableId,
        columnId,
        fromIndex,
        toIndex,
        timestamp: Date.now(),
        source: 'user',
      });
    },

    // Column visibility
    handleColumnVisibility: (columnId: ColumnId, visible: boolean) => {
      eventBus.emit('column:visibility-change', {
        tableId,
        columnId,
        visible,
        timestamp: Date.now(),
        source: 'user',
      });
    },

    // Column pinning
    handleColumnPin: (
      columnId: ColumnId,
      position: 'left' | 'right' | false
    ) => {
      eventBus.emit('column:pin', {
        tableId,
        columnId,
        position,
        timestamp: Date.now(),
        source: 'user',
      });
    },

    destroy: () => {
      handlers.forEach((unsubscribe) => unsubscribe());
      handlers.length = 0;
    },
  };

  // Subscribe to column events from UI (to be implemented by plugins)
  // This creates the bridge between UI actions and events

  return columnEventHandlers;
}
```

### **3. Row Event Integration**

```typescript
/**
 * Sets up row-specific event handlers.
 */
function setupRowEvents<TData>(
  table: Table<TData>,
  eventBus: EventBus
): RowEventHandlers {
  const handlers: Array<() => void> = [];
  const tableId = table.id;

  const rowEventHandlers = {
    // Row selection
    handleRowSelect: (rowId: RowId, selected: boolean, source: string) => {
      eventBus.emit('row:select', {
        tableId,
        rowId,
        selected,
        timestamp: Date.now(),
        source,
      });
    },

    // Row expansion
    handleRowExpand: (rowId: RowId, expanded: boolean) => {
      eventBus.emit('row:expand', {
        tableId,
        rowId,
        expanded,
        timestamp: Date.now(),
        source: 'user',
      });
    },

    // Row editing
    handleRowEditStart: (rowId: RowId) => {
      eventBus.emit('row:edit-start', {
        tableId,
        rowId,
        timestamp: Date.now(),
        source: 'user',
      });
    },

    handleRowEditCommit: (rowId: RowId, changes: Partial<TData>) => {
      eventBus.emit('row:edit-commit', {
        tableId,
        rowId,
        changes,
        timestamp: Date.now(),
        source: 'user',
      });
    },

    handleRowEditCancel: (rowId: RowId) => {
      eventBus.emit('row:edit-cancel', {
        tableId,
        rowId,
        timestamp: Date.now(),
        source: 'user',
      });
    },

    // Bulk operations
    handleBulkRowSelect: (rowIds: RowId[], selected: boolean) => {
      eventBus.emit('rows:bulk-select', {
        tableId,
        rowIds,
        selected,
        timestamp: Date.now(),
        source: 'user',
      });
    },

    destroy: () => {
      handlers.forEach((unsubscribe) => unsubscribe());
      handlers.length = 0;
    },
  };

  return rowEventHandlers;
}
```

### **4. Specific Event Emitters**

```typescript
/**
 * Emits column visibility change events.
 */
function emitColumnVisibilityEvents<TData>(
  previousState: TableState<TData>,
  newState: TableState<TData>,
  table: Table<TData>,
  eventBus: EventBus
): void {
  const previous = previousState.columnVisibility;
  const current = newState.columnVisibility;

  for (const columnId of Object.keys({ ...previous, ...current })) {
    const wasVisible = previous[columnId] !== false;
    const isVisible = current[columnId] !== false;

    if (wasVisible !== isVisible) {
      eventBus.emit('column:visibility-change', {
        tableId: table.id,
        columnId,
        visible: isVisible,
        timestamp: Date.now(),
        source: 'state',
      });
    }
  }
}

/**
 * Emits row selection change events.
 */
function emitRowSelectionEvents<TData>(
  previousState: TableState<TData>,
  newState: TableState<TData>,
  table: Table<TData>,
  eventBus: EventBus
): void {
  const previous = previousState.rowSelection;
  const current = newState.rowSelection;

  const added: RowId[] = [];
  const removed: RowId[] = [];

  // Find added selections
  for (const rowId of Object.keys(current)) {
    if (!previous[rowId]) {
      added.push(rowId);
    }
  }

  // Find removed selections
  for (const rowId of Object.keys(previous)) {
    if (!current[rowId]) {
      removed.push(rowId);
    }
  }

  if (added.length > 0 || removed.length > 0) {
    // Individual events
    added.forEach((rowId) => {
      eventBus.emit('row:select', {
        tableId: table.id,
        rowId,
        selected: true,
        timestamp: Date.now(),
        source: 'state',
      });
    });

    removed.forEach((rowId) => {
      eventBus.emit('row:select', {
        tableId: table.id,
        rowId,
        selected: false,
        timestamp: Date.now(),
        source: 'state',
      });
    });

    // Bulk event
    eventBus.emit('selection:change', {
      tableId: table.id,
      added,
      removed,
      total: Object.keys(current).length,
      timestamp: Date.now(),
      source: 'state',
    });
  }
}

/**
 * Emits sorting change events.
 */
function emitSortingEvents<TData>(
  previousState: TableState<TData>,
  newState: TableState<TData>,
  table: Table<TData>,
  eventBus: EventBus
): void {
  const previous = previousState.sorting || [];
  const current = newState.sorting || [];

  if (!shallowEqual(previous, current)) {
    eventBus.emit('sorting:change', {
      tableId: table.id,
      sorts: current,
      affectedRows: getAffectedRows(table, current),
      timestamp: Date.now(),
      source: 'state',
    });
  }
}
```

### **5. Event Bridge Types**

```typescript
/**
 * Bridge between table instance and event system.
 */
export interface TableEventBridge<TData extends RowData> {
  // Event emission
  emitEvent<T extends EventType>(event: T, payload: EventPayload<T>): void;
  emitStateUpdate(
    previousState: TableState<TData>,
    newState: TableState<TData>,
    changedKeys: Array<keyof TableState<TData>>
  ): void;
  emitDataChange(
    changeType: DataChangeType,
    rowIds: RowId[],
    data?: TData[],
    previousData?: TData[]
  ): void;

  // Event subscription
  on<T extends EventType>(
    event: T,
    handler: EventHandler<EventPayload<T>>,
    options?: EventHandlerOptions
  ): () => void;

  once<T extends EventType>(
    event: T,
    handler: EventHandler<EventPayload<T>>
  ): () => void;

  off<T extends EventType>(
    event: T,
    handler: EventHandler<EventPayload<T>>
  ): void;

  // Lifecycle
  destroy(): void;

  // Metadata
  readonly eventBus: EventBus;
  readonly tableId: GridId;
}

/**
 * Data change types.
 */
export type DataChangeType = 'add' | 'update' | 'delete' | 'replace' | 'bulk';

/**
 * Event-aware table extension.
 */
export interface EventfulTable<TData extends RowData> extends Table<TData> {
  readonly events: TableEventBridge<TData>;

  // Event shortcuts
  on<T extends EventType>(
    event: T,
    handler: EventHandler<EventPayload<T>>,
    options?: EventHandlerOptions
  ): () => void;

  emit<T extends EventType>(event: T, payload: EventPayload<T>): void;
}

/**
 * Creates event-aware table instance.
 */
export function createEventfulTable<TData extends RowData>(
  options: TableOptions<TData>
): EventfulTable<TData> {
  const table = createTable(options);
  const eventBus = createEventBus({ devMode: options.debug });
  const eventBridge = createTableEventBridge(table, eventBus);

  const eventfulTable: EventfulTable<TData> = {
    ...table,
    events: eventBridge,

    on: (event, handler, options) => eventBridge.on(event, handler, options),

    emit: (event, payload) => eventBridge.emitEvent(event, payload),

    // Override destroy to cleanup events
    destroy: () => {
      eventBridge.destroy();
      table.destroy();
    },
  };

  return eventfulTable;
}
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No UI event handling (DOM events)
- ❌ No framework-specific event adapters
- ❌ No complex event transformation logic
- ❌ No event persistence or storage
- ❌ No plugin system integration
- ❌ No DevTools UI components

## 📁 **File Structure**

```
packages/core/src/events/
├── integration/
│   ├── table-event-bridge.ts    # Main bridge implementation
│   ├── column-events.ts         # Column event integration
│   ├── row-events.ts            # Row event integration
│   └── state-events.ts          # State change events
├── emitters/
│   ├── column-emitters.ts       # Column-specific events
│   ├── row-emitters.ts          # Row-specific events
│   ├── state-emitters.ts        # State change emitters
│   └── data-emitters.ts         # Data change emitters
├── types/
│   ├── event-bridge.ts          # Bridge types
│   └── eventful-table.ts        # Event-aware table types
└── index.ts                     # Exports
```

## 🧪 **Test Requirements**

```typescript
describe('Event System Integration', () => {
  test('creates event bridge for table', () => {
    const table = createTable({ columns: [], data: [] });
    const eventBus = createEventBus();
    const bridge = createTableEventBridge(table, eventBus);

    expect(bridge.tableId).toBe(table.id);
    expect(bridge.eventBus).toBe(eventBus);
  });

  test('emits state change events', async () => {
    const table = createTable({ columns: [], data: [] });
    const eventBus = createEventBus();
    createTableEventBridge(table, eventBus);

    const events: any[] = [];
    eventBus.on('state:update', (event) => events.push(event));

    // Change table state
    table.setState({ data: [{ id: 1 }] });

    // Should emit state update event
    await waitFor(() => {
      expect(events).toHaveLength(1);
      expect(events[0].payload.tableId).toBe(table.id);
    });
  });

  test('emits row selection events', async () => {
    const table = createTable({
      columns: [{ accessorKey: 'id' }],
      data: [{ id: 1 }, { id: 2 }],
    });
    const eventBus = createEventBus();
    createTableEventBridge(table, eventBus);

    const selectionEvents: any[] = [];
    eventBus.on('row:select', (event) => selectionEvents.push(event));

    // Select a row via table state
    table.setState((prev) => ({
      ...prev,
      rowSelection: { '0': true },
    }));

    await waitFor(() => {
      expect(selectionEvents).toHaveLength(1);
      expect(selectionEvents[0].payload.rowId).toBe('0');
      expect(selectionEvents[0].payload.selected).toBe(true);
    });
  });

  test('provides eventful table wrapper', () => {
    const table = createEventfulTable({
      columns: [{ accessorKey: 'id' }],
      data: [{ id: 1 }],
    });

    // Should have event methods
    expect(table.on).toBeDefined();
    expect(table.emit).toBeDefined();
    expect(table.events).toBeDefined();

    // Event subscription should work
    const handler = jest.fn();
    const unsubscribe = table.on('state:update', handler);

    table.setState({ data: [] });
    expect(handler).toHaveBeenCalled();

    unsubscribe();
  });

  test('cleans up events on destroy', () => {
    const table = createEventfulTable({
      columns: [{ accessorKey: 'id' }],
      data: [{ id: 1 }],
    });

    const handler = jest.fn();
    table.on('state:update', handler);

    table.destroy();

    // Should not emit events after destroy
    // (Note: table.setState would throw after destroy)
    expect(() => table.destroy()).not.toThrow();
  });
});
```

## 💡 **Performance Optimizations**

```typescript
// 1. Batch event emissions for rapid state changes
class EventBatcher {
  private batch: Array<{ event: string; payload: any }> = [];
  private isBatching = false;

  emit(event: string, payload: any): void {
    this.batch.push({ event, payload });

    if (!this.isBatching) {
      this.isBatching = true;
      queueMicrotask(() => this.flush());
    }
  }

  private flush(): void {
    const events = this.batch;
    this.batch = [];
    this.isBatching = false;

    // Emit batched events
    events.forEach(({ event, payload }) => {
      this.eventBus.emit(event, payload);
    });
  }
}

// 2. Debounce high-frequency events
function createDebouncedEmitter(delay: number) {
  const timers = new Map<string, NodeJS.Timeout>();

  return {
    emit: (event: string, payload: any) => {
      if (timers.has(event)) {
        clearTimeout(timers.get(event)!);
      }

      timers.set(
        event,
        setTimeout(() => {
          eventBus.emit(event, payload);
          timers.delete(event);
        }, delay)
      );
    },
  };
}

// 3. Event filtering to reduce noise
class SmartEventEmitter {
  private lastEvents = new Map<string, any>();
  private equalityCheck: (a: any, b: any) => boolean;

  emit(event: string, payload: any): void {
    const last = this.lastEvents.get(event);

    // Skip if payload hasn't changed
    if (last && this.equalityCheck(last, payload)) {
      return;
    }

    this.lastEvents.set(event, payload);
    eventBus.emit(event, payload);
  }
}
```

## 📊 **Success Metrics**

- ✅ State change to event emission < 0.5ms
- ✅ 1000 sequential state updates < 50ms (batched)
- ✅ Memory usage stable with 1000 event listeners
- ✅ Zero event emissions after destroy
- ✅ Event types maintain full type safety
- ✅ 100% test coverage for event flows

## 🎯 **AI Implementation Strategy**

1. **Start with bridge implementation** - connect table to event bus
2. **Implement state event emitters** - table state → events
3. **Add column/row event handlers** - user actions → events
4. **Create eventful table wrapper** - convenience API
5. **Add performance optimizations** - batching and debouncing
6. **Test event flow integrity** - ensure all state changes emit events

**Critical:** The event system must not create circular dependencies or infinite loops. State changes should emit events, but events should not trigger unnecessary state changes.

---

**Status:** Ready for implementation. Focus on preventing event loops and ensuring efficient event propagation.
