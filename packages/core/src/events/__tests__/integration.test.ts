/**
 * Event system integration tests with Table.
 *
 * @module @gridkit/core/events/__tests__/integration.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTable } from '../../table/create-table';
import type { EventRegistry } from '../types';
import { EventPriority } from '../types';

type User = {
  id: number;
  name: string;
  email: string;
};

describe('Event System Integration with Table', () => {
  const users: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ];

  const columns = [
    { accessorKey: 'name' as const, header: 'Name' },
    { accessorKey: 'email' as const, header: 'Email' },
  ];

  describe('Basic Event Integration', () => {
    it('should provide event methods on table instance', () => {
      const table = createTable<User>({ columns, data: users });

      expect(table.on).toBeDefined();
      expect(table.once).toBeDefined();
      expect(table.off).toBeDefined();
      expect(table.emit).toBeDefined();
      expect(table.emitBatch).toBeDefined();
    });

    it('should subscribe to table events', async () => {
      const table = createTable<User>({ columns, data: users });
      const handler = vi.fn();

      const unsubscribe = table.on('grid:init', handler);

      // Wait for the automatic grid:init event from table creation
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Clear the handler to only count manual emissions
      handler.mockClear();

      // Manually emit event to test with IMMEDIATE priority for synchronous testing
      table.emit(
        'grid:init',
        { gridId: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'grid:init',
          payload: { gridId: 'test' },
        })
      );

      unsubscribe();
    });

    it('should emit lifecycle events automatically', () => {
      const initHandler = vi.fn();
      const readyHandler = vi.fn();

      // Create table with event handlers
      const table = createTable<User>({
        columns,
        data: users,
        meta: { gridId: 'test-grid' },
      });

      table.on('grid:init', initHandler);
      table.on('grid:ready', readyHandler);

      // Wait for async ready event
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(initHandler).toHaveBeenCalledTimes(1);
          expect(initHandler).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'grid:init',
              payload: { gridId: 'test-grid' },
            })
          );

          expect(readyHandler).toHaveBeenCalledTimes(1);
          expect(readyHandler).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'grid:ready',
              payload: expect.objectContaining({
                gridId: 'test-grid',
              }),
            })
          );
          resolve();
        }, 10);
      });
    });
  });

  describe('State Change Events', () => {
    it('should emit events on state changes', async () => {
      const table = createTable<User>({ columns, data: users });
      const stateChangeHandler = vi.fn();
      const visibilityHandler = vi.fn();

      table.on('grid:state-change', stateChangeHandler);
      table.on('column:visibility-change', visibilityHandler);

      // Change column visibility
      table.setState((prev) => ({
        ...prev,
        columnVisibility: { name: false },
      }));

      // Wait for async events
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(stateChangeHandler).toHaveBeenCalledTimes(1);
      expect(visibilityHandler).toHaveBeenCalledTimes(1);
      expect(visibilityHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'column:visibility-change',
          payload: { columnId: 'name', visible: false },
        })
      );
    });

    it('should emit selection events', async () => {
      const table = createTable<User>({ columns, data: users });
      const selectionHandler = vi.fn();

      table.on('selection:change', selectionHandler);

      // Select a row
      table.setState((prev) => ({
        ...prev,
        rowSelection: { '1': true },
      }));

      // Wait for async events
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(selectionHandler).toHaveBeenCalledTimes(1);
      expect(selectionHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'selection:change',
          payload: { selectedIds: ['1'] },
        })
      );
    });
  });

  describe('Destroy Events', () => {
    it('should emit destroy event and cleanup', async () => {
      const table = createTable<User>({ columns, data: users });
      const destroyHandler = vi.fn();
      const afterDestroyHandler = vi.fn();

      table.on('grid:destroy', destroyHandler);

      // Destroy the table
      table.destroy();

      // Wait for destroy event
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Try to subscribe after destroy - should not work
      table.on('grid:init', afterDestroyHandler);

      // Try to emit event after destroy
      table.emit(
        'grid:init',
        { gridId: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );

      expect(destroyHandler).toHaveBeenCalledTimes(1);
      expect(afterDestroyHandler).not.toHaveBeenCalled();
    });
  });

  describe('Custom Events', () => {
    it('should support custom events', async () => {
      const table = createTable<User>({ columns, data: users });
      const customHandler = vi.fn();

      // Extend event registry via declaration merging
      // In real usage, users would declare this in their own code
      interface ExtendedEvents extends EventRegistry {
        'custom:user-action': {
          action: string;
          userId: string;
        };
      }

      table.on('custom:user-action', customHandler);

      table.emit(
        'custom:user-action',
        {
          action: 'click',
          userId: '123',
        },
        { priority: EventPriority.IMMEDIATE }
      );

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(customHandler).toHaveBeenCalledTimes(1);
      expect(customHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'custom:user-action',
          payload: { action: 'click', userId: '123' },
        })
      );
    });
  });

  describe('Event Priority in Table', () => {
    it('should support event priority in table', async () => {
      const table = createTable<User>({ columns, data: users });
      const executionOrder: string[] = [];

      // Wait for the automatic grid:init event from table creation
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Now register handlers - they won't receive the automatic event
      table.on('grid:init', () => executionOrder.push('normal'), {
        priority: EventPriority.NORMAL,
      });
      table.on('grid:init', () => executionOrder.push('high'), {
        priority: EventPriority.HIGH,
      });

      // Manually emit event
      table.emit(
        'grid:init',
        { gridId: 'test' },
        {
          priority: EventPriority.NORMAL,
        }
      );
      // Wait for async execution
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          // Both handlers should be called exactly once
          expect(executionOrder).toHaveLength(2);
          expect(executionOrder).toContain('high');
          expect(executionOrder).toContain('normal');
          resolve();
        }, 100);
      });
    });
  });

  describe('Batch Events', () => {
    it('should support batch events in table', async () => {
      const table = createTable<User>({ columns, data: users });
      const rowHandler = vi.fn();
      const columnHandler = vi.fn();

      table.on('row:add', rowHandler);
      table.on('column:add', columnHandler);

      table.emitBatch([
        {
          event: 'row:add',
          payload: { rowId: 'row-1', index: 0, isNew: true },
          priority: EventPriority.IMMEDIATE,
        },
        {
          event: 'column:add',
          payload: { columnId: 'col-1', index: 0 },
          priority: EventPriority.IMMEDIATE,
        },
      ]);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(rowHandler).toHaveBeenCalledTimes(1);
      expect(columnHandler).toHaveBeenCalledTimes(1);
    });
  });
});
