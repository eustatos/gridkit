import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEventBus } from '../EventBus';
import { EventPriority } from '../types';

// Helper to wait for microtasks to complete
const flushMicrotasks = () =>
  new Promise((resolve) => {
    if (typeof queueMicrotask !== 'undefined') {
      queueMicrotask(() => queueMicrotask(() => queueMicrotask(resolve)));
    } else {
      // Fallback for environments without queueMicrotask
      setTimeout(resolve, 0);
    }
  });

// Mock branded types for testing
const createRowId = (id: string) => id as any;
const createColumnId = (id: string) => id as any;
const createGridId = (id: string) => id as any;

describe('EventBus', () => {
  let bus: ReturnType<typeof createEventBus>;

  beforeEach(() => {
    bus = createEventBus({ devMode: false });
  });

  describe('Type Safety', () => {
    it('should enforce correct payload types', async () => {
      const handler = vi.fn();

      bus.on('row:add', handler);
      bus.emit('row:add', {
        rowId: createRowId('123'),
        index: 0,
        isNew: true,
      });

      // Wait for async execution (NORMAL priority events are async)
      await flushMicrotasks();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'row:add',
          payload: {
            rowId: expect.any(String),
            index: 0,
            isNew: true,
          },
        })
      );
    });

    it('should use branded types for IDs', async () => {
      const handler = vi.fn<[any]>();

      bus.on('column:add', handler);
      bus.emit('column:add', {
        columnId: createColumnId('col-1'),
        index: 0,
      });

      // Wait for async execution
      await flushMicrotasks();

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0];
      expect(event.payload.columnId).toBe('col-1');
    });
  });

  describe('Event Emission', () => {
    it('should emit and handle events', async () => {
      const handler = vi.fn();

      bus.on('grid:init', handler);
      bus.emit('grid:init', { gridId: createGridId('test-grid') });

      // Wait for async execution
      await flushMicrotasks();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support once subscriptions', async () => {
      const handler = vi.fn();

      bus.once('grid:ready', handler);
      bus.emit('grid:ready', {
        gridId: createGridId('test'),
        timestamp: Date.now(),
        meta: {} as any,
      });

      // Wait for async execution of first emit
      await flushMicrotasks();

      // Second emit
      bus.emit('grid:ready', {
        gridId: createGridId('test'),
        timestamp: Date.now(),
        meta: {} as any,
      });

      // Wait for async execution of second emit
      await flushMicrotasks();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe correctly', async () => {
      const handler = vi.fn();

      const unsubscribe = bus.on('row:update', handler);
      unsubscribe();

      bus.emit('row:update', {
        rowId: createRowId('123'),
        changes: {},
        isDirty: false,
      });

      // Wait for async execution
      await flushMicrotasks();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Event Priority', () => {
    it('should respect priority order', async () => {
      const order: string[] = [];

      // Note: Lower number = higher priority
      // IMMEDIATE (0) > HIGH (1) > NORMAL (2) > LOW (3)
      bus.on('grid:init', () => order.push('normal'), {
        priority: EventPriority.NORMAL, // 2
      });
      bus.on('grid:init', () => order.push('high'), {
        priority: EventPriority.HIGH, // 1
      });
      bus.on('grid:init', () => order.push('low'), {
        priority: EventPriority.LOW, // 3
      });

      bus.emit('grid:init', { gridId: createGridId('test') });

      // Wait for async execution
      await flushMicrotasks();

      // HIGH (1) should execute first, then NORMAL (2), then LOW (3)
      expect(order).toEqual(['high', 'normal', 'low']);
    });

    it('should handle mixed priorities in same event', async () => {
      const order: string[] = [];

      // Register handlers with different priorities for same event
      // Note: Lower number = higher priority
      bus.on('test:event', () => order.push('low'), {
        priority: EventPriority.LOW, // 3 (lowest)
      });
      bus.on('test:event', () => order.push('normal'), {
        priority: EventPriority.NORMAL, // 2
      });
      bus.on('test:event', () => order.push('high'), {
        priority: EventPriority.HIGH, // 1
      });
      bus.on('test:event', () => order.push('immediate'), {
        priority: EventPriority.IMMEDIATE, // 0 (highest)
      });

      bus.emit('test:event', { gridId: createGridId('test') });

      // Wait for async execution
      await flushMicrotasks();

      // Handlers should execute in priority order (highest first)
      // Immediate (0) -> High (1) -> Normal (2) -> Low (3)
      expect(order).toEqual(['immediate', 'high', 'normal', 'low']);

      // Альтернативная проверка через индексы
      const immediateIndex = order.indexOf('immediate');
      const highIndex = order.indexOf('high');
      const normalIndex = order.indexOf('normal');
      const lowIndex = order.indexOf('low');

      expect(immediateIndex).toBeLessThan(highIndex);
      expect(highIndex).toBeLessThan(normalIndex);
      expect(normalIndex).toBeLessThan(lowIndex);
    });
  });
  describe('Middleware', () => {
    it('should apply middleware', async () => {
      const middleware = vi.fn((event) => event);
      const handler = vi.fn();

      bus.use(middleware);
      bus.on('grid:init', handler);
      bus.emit('grid:init', { gridId: createGridId('test') });

      // Wait for async execution
      await flushMicrotasks();

      expect(middleware).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });

    it('should cancel events from middleware', async () => {
      const handler = vi.fn();

      bus.use(() => null); // Cancel all events
      bus.on('grid:init', handler);
      bus.emit('grid:init', { gridId: createGridId('test') });

      // Wait for async execution
      await flushMicrotasks();

      expect(handler).not.toHaveBeenCalled();
    });

    it('should transform events with middleware', async () => {
      const handler = vi.fn();
      const transformedMeta = { custom: 'meta' };

      bus.use((event) => ({
        ...event,
        metadata: transformedMeta,
      }));

      bus.on('grid:init', handler);
      bus.emit('grid:init', { gridId: createGridId('test') });

      // Wait for async execution
      await flushMicrotasks();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: transformedMeta,
        })
      );
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory', async () => {
      const handlers = [];

      for (let i = 0; i < 1000; i++) {
        const handler = vi.fn();
        handlers.push(handler);
        bus.on('grid:init', handler);
      }

      // Emit to ensure handlers are registered
      bus.emit('grid:init', { gridId: createGridId('test') });
      await flushMicrotasks();

      // Unsubscribe all via clear
      bus.clear();

      // Check handlers count
      expect(bus.getStats().totalHandlers).toBe(0);

      // Try to emit again - should not call handlers
      bus.emit('grid:init', { gridId: createGridId('test') });
      await flushMicrotasks();

      // No handlers should be called
      for (const handler of handlers) {
        expect(handler).toHaveBeenCalledTimes(1); // Only once from first emit
      }
    });

    it('should clean up once handlers automatically', async () => {
      const handler = vi.fn();

      bus.once('grid:init', handler);

      // First emit
      bus.emit('grid:init', { gridId: createGridId('test') });
      await flushMicrotasks();

      // Second emit - handler should not be called again
      bus.emit('grid:init', { gridId: createGridId('test') });
      await flushMicrotasks();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(bus.getStats().totalHandlers).toBe(0);
    });
  });

  describe('Batch Operations', () => {
    it('should emit multiple events', async () => {
      const handler = vi.fn();

      bus.on('row:add', handler);

      bus.emitBatch([
        {
          event: 'row:add',
          payload: { rowId: createRowId('1'), index: 0, isNew: true },
        },
        {
          event: 'row:add',
          payload: { rowId: createRowId('2'), index: 1, isNew: true },
        },
      ]);

      // Wait for async execution
      await flushMicrotasks();

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should handle batch with mixed priorities', async () => {
      const order: string[] = [];

      bus.on('batch:test', (event) => {
        order.push((event.payload as any).id);
      });

      bus.emitBatch([
        {
          event: 'batch:test',
          payload: { id: 'low' },
          priority: EventPriority.LOW,
        },
        {
          event: 'batch:test',
          payload: { id: 'normal' },
          priority: EventPriority.NORMAL,
        },
        {
          event: 'batch:test',
          payload: { id: 'high' },
          priority: EventPriority.HIGH,
        },
        {
          event: 'batch:test',
          payload: { id: 'immediate' },
          priority: EventPriority.IMMEDIATE,
        },
      ]);

      // Immediate should be in order immediately
      expect(order).toContain('immediate');

      // Wait for async execution
      await flushMicrotasks();

      // Check order (excluding immediate which we already checked)
      const remainingOrder = order.filter((id) => id !== 'immediate');
      expect(remainingOrder).toEqual(['high', 'normal', 'low']);
    });
  });

  describe('Extended Events', () => {
    it('should support state update events', async () => {
      const handler = vi.fn();

      bus.on('state:update', handler);

      bus.emit('state:update', {
        previousState: { data: [] } as any,
        newState: { data: [] } as any,
        changedKeys: [],
      });

      // Wait for async execution
      await flushMicrotasks();

      expect(handler).toHaveBeenCalled();
    });

    it('should support data load events', async () => {
      const handler = vi.fn();

      bus.on('table:data', handler);

      bus.emit('table:data', {
        data: [],
        source: 'initial',
      });

      // Wait for async execution
      await flushMicrotasks();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Filter Options', () => {
    it('should filter events based on condition', async () => {
      const handler = vi.fn();

      bus.on('row:update', handler, {
        filter: (event) => (event.payload as any).rowId === '123',
      });

      bus.emit('row:update', {
        rowId: createRowId('123'),
        changes: {},
        isDirty: false,
      });

      bus.emit('row:update', {
        rowId: createRowId('456'),
        changes: {},
        isDirty: false,
      });

      // Wait for async execution
      await flushMicrotasks();

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Statistics', () => {
    it('should track event statistics', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on('event:a', handler1);
      bus.on('event:b', handler2);

      bus.emit('event:a', { gridId: createGridId('test') });
      bus.emit('event:b', { gridId: createGridId('test') });
      bus.emit('event:a', { gridId: createGridId('test') });

      // Wait for async execution
      await flushMicrotasks();

      const stats = bus.getStats();

      expect(stats.totalEvents).toBe(3);
      expect(stats.totalHandlers).toBe(2);
      expect(stats.eventCounts.get('event:a')).toBe(2);
      expect(stats.eventCounts.get('event:b')).toBe(1);
    });
  });

  describe('Async Handlers', () => {
    it('should handle async handlers correctly', async () => {
      const order: string[] = [];
      const asyncMock = vi.fn();

      bus.on('test:async', async () => {
        order.push('async-start');
        await Promise.resolve();
        asyncMock();
        order.push('async-end');
      });

      bus.on('test:sync', () => {
        order.push('sync');
      });

      // Emit events
      bus.emit('test:async', {});
      bus.emit('test:sync', {});

      // Wait for all async operations including handler promises
      await flushMicrotasks();
      await flushMicrotasks(); // Extra flush for promise resolution

      // Async handler shouldn't block sync handler
      expect(order).toContain('async-start');
      expect(order).toContain('sync');
      expect(asyncMock).toHaveBeenCalled();
    });
  });
});
