import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEventBus } from '../EventBus';
import type { EventPayload } from '../types';
import { EventPriority } from '../types';

// Mock branded types for testing
const createRowId = (id: string) => id as any;
const createColumnId = (id: string) => id as any;
const createGridId = (id: string) => id as any;
const createCellId = (id: string) => id as any;
const createColumnGroupId = (id: string) => id as any;

describe('EventBus', () => {
  let bus: ReturnType<typeof createEventBus>;

  beforeEach(() => {
    bus = createEventBus({ devMode: false });
  });

  describe('Type Safety', () => {
    it('should enforce correct payload types', () => {
      const handler = vi.fn();

      bus.on('row:add', handler);
      bus.emit('row:add', {
        rowId: createRowId('123'),
        index: 0,
        isNew: true,
      });

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

    it('should use branded types for IDs', () => {
      const handler = vi.fn<[any]>();

      bus.on('column:add', handler);
      bus.emit('column:add', {
        columnId: createColumnId('col-1'),
        index: 0,
      });

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0];
      expect(event.payload.columnId).toBe('col-1');
    });
  });

  describe('Event Emission', () => {
    it('should emit and handle events', () => {
      const handler = vi.fn();

      bus.on('grid:init', handler);
      bus.emit('grid:init', { gridId: createGridId('test-grid') });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support once subscriptions', () => {
      const handler = vi.fn();

      bus.once('grid:ready', handler);
      bus.emit('grid:ready', {
        gridId: createGridId('test'),
        timestamp: Date.now(),
        meta: {} as any,
      });
      bus.emit('grid:ready', {
        gridId: createGridId('test'),
        timestamp: Date.now(),
        meta: {} as any,
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe correctly', () => {
      const handler = vi.fn();

      const unsubscribe = bus.on('row:update', handler);
      unsubscribe();

      bus.emit('row:update', {
        rowId: createRowId('123'),
        changes: {},
        isDirty: false,
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Event Priority', () => {
    it('should respect priority order', async () => {
      const order: number[] = [];

      bus.on('grid:init', () => order.push(2), { priority: EventPriority.NORMAL });
      bus.on('grid:init', () => order.push(1), { priority: EventPriority.HIGH });
      bus.on('grid:init', () => order.push(3), { priority: EventPriority.LOW });

      bus.emit('grid:init', { gridId: createGridId('test') });

      // Events should be processed immediately
      expect(order).toEqual([1, 2, 3]);
    });

    it('should execute IMMEDIATE priority synchronously', () => {
      const order: string[] = [];

      bus.on('grid:init', () => order.push('handler'), { priority: EventPriority.IMMEDIATE });
      bus.emit('grid:init', { gridId: createGridId('test') }, { priority: EventPriority.IMMEDIATE });
      order.push('after-emit');

      expect(order).toEqual(['handler', 'after-emit']);
    });
  });

  describe('Middleware', () => {
    it('should apply middleware', () => {
      const middleware = vi.fn((event) => event);

      bus.use(middleware);
      bus.emit('grid:init', { gridId: createGridId('test') });

      expect(middleware).toHaveBeenCalled();
    });

    it('should cancel events from middleware', () => {
      const handler = vi.fn();

      bus.use(() => null); // Cancel all events
      bus.on('grid:init', handler);
      bus.emit('grid:init', { gridId: createGridId('test') });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory', () => {
      const handlers = [];

      for (let i = 0; i < 1000; i++) {
        const handler = vi.fn();
        handlers.push(handler);
        bus.on('grid:init', handler);
      }

      // Unsubscribe all
      bus.clear();

      expect(bus.getStats().totalHandlers).toBe(0);
    });
  });

  describe('Batch Operations', () => {
    it('should emit multiple events', () => {
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

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Extended Events', () => {
    it('should support state update events', () => {
      const handler = vi.fn();

      bus.on('state:update', handler);

      bus.emit('state:update', {
        previousState: { data: [] } as any,
        newState: { data: [] } as any,
        changedKeys: [],
      });

      expect(handler).toHaveBeenCalled();
    });

    it('should support data load events', () => {
      const handler = vi.fn();

      bus.on('table:data', handler);

      bus.emit('table:data', {
        data: [],
        source: 'initial',
      });

      expect(handler).toHaveBeenCalled();
    });
  });
});