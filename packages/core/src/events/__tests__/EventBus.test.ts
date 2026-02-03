/**
 * EventBus tests.
 *
 * @module @gridkit/core/events/__tests__/EventBus.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEventBus, getEventBus, resetEventBus } from '../EventBus';
import { EventPriority } from '../types';
import type { EventRegistry } from '../types';

describe('EventBus', () => {
  let bus: ReturnType<typeof createEventBus>;

  beforeEach(() => {
    bus = createEventBus({ devMode: false });
  });

  afterEach(() => {
    bus.clear();
  });

  describe('Basic Operations', () => {
    it('should subscribe and emit events', async () => {
      const handler = vi.fn();

      bus.on('grid:init', handler);
      bus.emit(
        'grid:init',
        { gridId: 'test-grid' },
        { priority: EventPriority.IMMEDIATE }
      );

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'grid:init',
          payload: { gridId: 'test-grid' },
        })
      );
    });

    it('should unsubscribe from events', async () => {
      const handler = vi.fn();

      const unsubscribe = bus.on('grid:init', handler);
      unsubscribe();

      bus.emit(
        'grid:init',
        { gridId: 'test-grid' },
        { priority: EventPriority.IMMEDIATE }
      );

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support once subscriptions', async () => {
      const handler = vi.fn();

      bus.once('grid:ready', handler);
      bus.emit(
        'grid:ready',
        {
          gridId: 'test',
          timestamp: 1234567890,
          meta: {},
        },
        { priority: EventPriority.IMMEDIATE }
      );
      bus.emit(
        'grid:ready',
        {
          gridId: 'test',
          timestamp: 1234567891,
          meta: {},
        },
        { priority: EventPriority.IMMEDIATE }
      );

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple handlers per event', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.on('row:add', handler1);
      bus.on('row:add', handler2);

      bus.emit(
        'row:add',
        {
          rowId: 'row-1',
          index: 0,
          isNew: true,
        },
        { priority: EventPriority.IMMEDIATE }
      );

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Priority', () => {
    it('should execute IMMEDIATE priority synchronously', () => {
      const executionOrder: string[] = [];

      bus.on('grid:init', () => executionOrder.push('handler'), {
        priority: EventPriority.IMMEDIATE,
      });

      bus.emit(
        'grid:init',
        { gridId: 'test' },
        {
          priority: EventPriority.IMMEDIATE,
        }
      );
      executionOrder.push('after-emit');

      // IMMEDIATE should execute synchronously
      expect(executionOrder).toEqual(['handler', 'after-emit']);
    });

    it('should respect priority order for async execution', async () => {
      const executionOrder: number[] = [];

      bus.on('grid:init', () => executionOrder.push(2), {
        priority: EventPriority.NORMAL,
      });
      bus.on('grid:init', () => executionOrder.push(1), {
        priority: EventPriority.HIGH,
      });
      bus.on('grid:init', () => executionOrder.push(3), {
        priority: EventPriority.LOW,
      });

      bus.emit(
        'grid:init',
        { gridId: 'test' },
        {
          priority: EventPriority.NORMAL,
        }
      );
      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // All handlers should be called
      expect(executionOrder).toHaveLength(3);
      expect(executionOrder).toEqual(expect.arrayContaining([1, 2, 3]));

      // HIGH priority (1) should execute before LOW priority (3)
      const highIndex = executionOrder.indexOf(1);
      const lowIndex = executionOrder.indexOf(3);
      expect(highIndex).toBeLessThan(lowIndex);
    });
  });

  describe('Error Handling', () => {
    it('should not crash when handler throws', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();

      bus.on('grid:init', errorHandler, { priority: EventPriority.IMMEDIATE });
      bus.on('grid:init', normalHandler, { priority: EventPriority.IMMEDIATE });
      // Should not throw
      expect(() => {
        bus.emit(
          'grid:init',
          { gridId: 'test' },
          { priority: EventPriority.IMMEDIATE }
        );
      }).not.toThrow();

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Normal handler should still be called
      expect(normalHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle async handler errors', async () => {
      const asyncHandler = vi.fn(async () => {
        throw new Error('Async error');
      });

      bus.on('grid:init', asyncHandler, { priority: EventPriority.IMMEDIATE });
      bus.emit(
        'grid:init',
        { gridId: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );
      // Wait for async error to be caught
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(asyncHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Memory Management', () => {
    it('should cleanup all handlers on clear', async () => {
      const handler = vi.fn();

      bus.on('grid:init', handler, { priority: EventPriority.IMMEDIATE });
      bus.on('row:add', handler, { priority: EventPriority.IMMEDIATE });
      bus.on('column:add', handler, { priority: EventPriority.IMMEDIATE });
      expect(bus.getHandlerCount('grid:init')).toBe(1);
      expect(bus.getHandlerCount('row:add')).toBe(1);
      expect(bus.getHandlerCount('column:add')).toBe(1);

      bus.clear();

      expect(bus.getHandlerCount('grid:init')).toBe(0);
      expect(bus.getHandlerCount('row:add')).toBe(0);
      expect(bus.getHandlerCount('column:add')).toBe(0);
    });

    it('should not leak memory with many handlers', async () => {
      const handlers = new Array(1000).fill(null).map(() => vi.fn());

      handlers.forEach((handler, i) => {
        bus.on('grid:init', handler, { priority: EventPriority.IMMEDIATE });
      });

      expect(bus.getHandlerCount('grid:init')).toBe(1000);

      // Emit event (should handle all handlers)
      bus.emit(
        'grid:init',
        { gridId: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));
      handlers.forEach((handler) => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Batch Operations', () => {
    it('should emit multiple events in batch', async () => {
      const rowHandler = vi.fn();
      const columnHandler = vi.fn();

      bus.on('row:add', rowHandler, { priority: EventPriority.IMMEDIATE });
      bus.on('column:add', columnHandler, {
        priority: EventPriority.IMMEDIATE,
      });
      bus.emitBatch([
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
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(rowHandler).toHaveBeenCalledTimes(1);
      expect(columnHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Middleware', () => {
    it('should apply middleware to events', async () => {
      const handler = vi.fn();
      const middleware = vi.fn((event) => {
        return {
          ...event,
          payload: { ...event.payload, modified: true },
        };
      });

      bus.use(middleware);
      bus.on('grid:init', handler, { priority: EventPriority.IMMEDIATE });
      bus.emit(
        'grid:init',
        { gridId: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(middleware).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { gridId: 'test', modified: true },
        })
      );
    });

    it('should allow middleware to cancel events', async () => {
      const handler = vi.fn();
      const middleware = vi.fn(() => null); // Cancel all events

      bus.use(middleware);
      bus.on('grid:init', handler, { priority: EventPriority.IMMEDIATE });
      bus.emit(
        'grid:init',
        { gridId: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(middleware).toHaveBeenCalledTimes(1);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should track event statistics', async () => {
      const handler = vi.fn();

      bus.on('grid:init', handler, { priority: EventPriority.IMMEDIATE });
      bus.on('row:add', handler, { priority: EventPriority.IMMEDIATE });

      bus.emit(
        'grid:init',
        { gridId: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );
      bus.emit(
        'grid:init',
        { gridId: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );
      bus.emit(
        'row:add',
        { rowId: 'row-1', index: 0, isNew: true },
        { priority: EventPriority.IMMEDIATE }
      );

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));
      const stats = bus.getStats();

      expect(stats.totalEvents).toBe(3);
      expect(stats.totalHandlers).toBe(2);
      expect(stats.eventCounts.get('grid:init')).toBe(2);
      expect(stats.eventCounts.get('row:add')).toBe(1);
    });
  });
});

describe('EventBus Singleton', () => {
  afterEach(() => {
    // Reset singleton between tests
    resetEventBus();
  });

  it('should provide singleton instance', () => {
    const bus1 = getEventBus();
    const bus2 = getEventBus();

    expect(bus1).toBe(bus2);
  });

  it('should allow creating isolated instances', () => {
    const bus1 = createEventBus();
    const bus2 = createEventBus();

    expect(bus1).not.toBe(bus2);
  });
});
