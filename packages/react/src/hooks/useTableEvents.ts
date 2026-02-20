import { useEffect, useRef, useCallback, useMemo } from 'react';
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
 * @template TData - Row data type
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
  handler: EventHandler<GridEvent>,
  options: UseEventOptions = {}
): void {
  const {
    enabled = true,
    debounce,
    throttle,
    once = false,
  } = options;

  // Store handler in ref to avoid re-subscribing
  const handlerRef = useRef<EventHandler<GridEvent>>(handler);
  handlerRef.current = handler;

  // Refs for tracking timeout and last call time
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);

  // Debounced/throttled handler
  const processedHandler = useCallback((event: GridEvent): void => {
    if (debounce) {
      // Debounce: delay execution
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = setTimeout(() => {
        handlerRef.current(event);
      }, debounce);
    } else if (throttle) {
      // Throttle: limit execution rate
      const now = Date.now();
      if (now - lastCallTimeRef.current >= throttle) {
        lastCallTimeRef.current = now;
        handlerRef.current(event);
      }
    } else {
      // No delay
      handlerRef.current(event);
    }
  }, [debounce, throttle]);

  useEffect(() => {
    if (!enabled) return;

    const wrappedHandler: EventHandler<GridEvent> = (event) => {
      processedHandler(event);
    };

    const unsubscribe = table._internal.eventBus.on(eventType, wrappedHandler, {
      once,
    });

    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      unsubscribe();
    };
  }, [table, eventType, enabled, debounce, throttle, once, processedHandler]);
}

/**
 * Hook to subscribe to multiple events
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param events - Record of event types to handlers
 * @param options - Subscription options
 * 
 * @example
 * ```tsx
 * useTableEvents(table, {
 *   'state:update': (event) => console.log('State', event.payload),
 *   'row:select': (event) => console.log('Selected', event.payload),
 * }, { enabled: true });
 * ```
 */
export function useTableEvents<TData extends RowData>(
  table: Table<TData>,
  events: Record<string, EventHandler<GridEvent>>,
  options: UseEventOptions = {}
): void {
  const enabled = options.enabled ?? true;
  const once = options.once ?? false;
  const eventEntries = useMemo(() => Object.entries(events), [events]);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribers = eventEntries.map(([eventType, handler]) => {
      return table._internal.eventBus.on(eventType, handler, { once });
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [table, enabled, once, ...eventEntries.map(([type]) => type)]);
}

/**
 * Hook to subscribe to state change events
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param handler - Function to call when state changes
 * @param options - Subscription options
 * 
 * @example
 * ```tsx
 * useTableStateChange(table, (state) => {
 *   console.log('New state:', state);
 * });
 * ```
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
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param handler - Function to call when row selection changes
 * @param options - Subscription options
 * 
 * @example
 * ```tsx
 * useRowSelection(table, (selectedRows) => {
 *   console.log('Selected:', selectedRows);
 * });
 * ```
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

/**
 * Hook to subscribe to column events
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param handler - Function to call when column events occur
 * @param options - Subscription options
 */
export function useColumnEvents<TData extends RowData>(
  table: Table<TData>,
  handler: (event: GridEvent) => void,
  options: UseEventOptions = {}
): void {
  useTableEvents(
    table,
    {
      'column:resize': handler,
      'column:reorder': handler,
      'column:visibility': handler,
      'column:pin': handler,
    },
    options
  );
}

/**
 * Hook to subscribe to data events
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param handler - Function to call when data events occur
 * @param options - Subscription options
 */
export function useDataEvents<TData extends RowData>(
  table: Table<TData>,
  handler: (event: GridEvent) => void,
  options: UseEventOptions = {}
): void {
  useTableEvents(
    table,
    {
      'data:loaded': handler,
      'data:changed': handler,
      'data:reload': handler,
    },
    options
  );
}

/**
 * Hook to subscribe to grid lifecycle events
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param handler - Function to call when grid events occur
 * @param options - Subscription options
 */
export function useGridEvents<TData extends RowData>(
  table: Table<TData>,
  handler: (event: GridEvent) => void,
  options: UseEventOptions = {}
): void {
  useTableEvents(
    table,
    {
      'table:init': handler,
      'table:reset': handler,
      'table:destroy': handler,
    },
    options
  );
}

/**
 * Hook to subscribe to sorting events
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param handler - Function to call when sorting changes
 * @param options - Subscription options
 */
export function useSortingEvents<TData extends RowData>(
  table: Table<TData>,
  handler: (event: GridEvent) => void,
  options: UseEventOptions = {}
): void {
  useTableEvent(table, 'sorting:change', handler, options);
}

/**
 * Hook to subscribe to filtering events
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param handler - Function to call when filtering changes
 * @param options - Subscription options
 */
export function useFilteringEvents<TData extends RowData>(
  table: Table<TData>,
  handler: (event: GridEvent) => void,
  options: UseEventOptions = {}
): void {
  useTableEvent(table, 'filtering:change', handler, options);
}

/**
 * Hook to subscribe to pagination events
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param handler - Function to call when pagination changes
 * @param options - Subscription options
 */
export function usePaginationEvents<TData extends RowData>(
  table: Table<TData>,
  handler: (event: GridEvent) => void,
  options: UseEventOptions = {}
): void {
  useTableEvent(table, 'pagination:change', handler, options);
}

/**
 * Hook to subscribe to expansion events
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param handler - Function to call when expansion changes
 * @param options - Subscription options
 */
export function useExpansionEvents<TData extends RowData>(
  table: Table<TData>,
  handler: (event: GridEvent) => void,
  options: UseEventOptions = {}
): void {
  useTableEvent(table, 'expanded:change', handler, options);
}

/**
 * Hook to subscribe to selection events
 * 
 * @template TData - Row data type
 * @param table - Table instance
 * @param handler - Function to call when selection changes
 * @param options - Subscription options
 */
export function useSelectionEvents<TData extends RowData>(
  table: Table<TData>,
  handler: (event: GridEvent) => void,
  options: UseEventOptions = {}
): void {
  useTableEvent(table, 'selection:change', handler, options);
}
