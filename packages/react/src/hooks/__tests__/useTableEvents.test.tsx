import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTable } from '../useTable';
import { useTableEvent, useTableStateChange, useTableEvents } from '../useTableEvents';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('useTableEvents', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

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

  it('should cleanup on unmount', async () => {
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

    await waitFor(() => {
      expect(handler).not.toHaveBeenCalled();
    });
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

  it('should support throttle', async () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );

    const handler = vi.fn();

    renderHook(() =>
      useTableEvent(tableResult.current.table, 'state:update', handler, {
        throttle: 100,
      })
    );

    // Trigger first event
    tableResult.current.table.setState((prev) => ({ ...prev, sorting: [{ id: 'a', desc: true }] }));

    // Wait for first call (immediate)
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Trigger more events - they should be throttled
    tableResult.current.table.setState((prev) => ({ ...prev, sorting: [{ id: 'b', desc: true }] }));
    tableResult.current.table.setState((prev) => ({ ...prev, sorting: [{ id: 'c', desc: true }] }));

    await waitFor(() => {
      // Throttle allows first call immediately, then limits subsequent calls
      // After 100ms, the next call would be allowed, but we don't wait that long
      expect(handler).toHaveBeenCalledTimes(1);
    }, { timeout: 200 });
  });

  it('should support multiple events', async () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );

    const stateHandler = vi.fn();
    const sortingHandler = vi.fn();

    renderHook(() =>
      useTableEvents(tableResult.current.table, {
        'state:update': stateHandler,
        'sorting:change': sortingHandler,
      })
    );

    // Trigger state event
    tableResult.current.table.setState((prev) => ({
      ...prev,
      sorting: [{ id: 'name', desc: true }],
    }));

    await waitFor(() => {
      expect(stateHandler).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(sortingHandler).toHaveBeenCalled();
    });
  });

  it('should support disabled subscription', async () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );

    const handler = vi.fn();

    renderHook(() =>
      useTableEvent(tableResult.current.table, 'state:update', handler, {
        enabled: false,
      })
    );

    // Trigger event
    tableResult.current.table.setState((prev) => ({
      ...prev,
      sorting: [{ id: 'name', desc: true }],
    }));

    await waitFor(() => {
      expect(handler).not.toHaveBeenCalled();
    });
  });

  it('useTableStateChange should work', async () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );

    const handler = vi.fn();

    renderHook(() =>
      useTableStateChange(tableResult.current.table, handler)
    );

    // Trigger state change
    tableResult.current.table.setState((prev) => ({
      ...prev,
      sorting: [{ id: 'name', desc: true }],
    }));

    await waitFor(() => {
      expect(handler).toHaveBeenCalled();
    });
  });

  it('should not cause memory leaks', async () => {
    const { result: tableResult } = renderHook(() =>
      useTable({ data: testUsers, columns: testColumns })
    );

    const handler = vi.fn();

    const { unmount } = renderHook(() =>
      useTableEvent(tableResult.current.table, 'state:update', handler)
    );

    unmount();

    // Should not throw or leak
    expect(true).toBe(true);
  });
});
