import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from '../EventBus';
import { createSimpleBatchMiddleware } from '../middleware/simple-batch';
import { createSimpleDebounceMiddleware } from '../middleware/simple-debounce';
import { createSimpleThrottleMiddleware } from '../middleware/throttle';

// Mock branded types for testing
const createRowId = (id: string) => id as any;
const createGridId = (id: string) => id as any;

// Helper to wait for async events
const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Event Middleware', () => {
  describe('Simple Batch Middleware', () => {
    it('should batch events (every 2nd event passes)', async () => {
      const bus = createEventBus();
      const handler = vi.fn();

      // Create batch middleware that lets through every 2nd event
      const batchMiddleware = createSimpleBatchMiddleware({ batchSize: 2 });

      bus.use(batchMiddleware);
      bus.on('row:add', handler);

      // Emit 4 events
      bus.emit('row:add', {
        rowId: createRowId('1'),
        index: 0,
        isNew: true,
      });

      bus.emit('row:add', {
        rowId: createRowId('2'),
        index: 1,
        isNew: true,
      });

      bus.emit('row:add', {
        rowId: createRowId('3'),
        index: 2,
        isNew: true,
      });

      bus.emit('row:add', {
        rowId: createRowId('4'),
        index: 3,
        isNew: true,
      });

      // Wait for async execution
      await waitForAsync();

      // Only 2nd and 4th events should pass through
      expect(handler).toHaveBeenCalledTimes(2);

      // Check events
      const calls = handler.mock.calls;
      expect(calls[0][0].payload.rowId).toBe('2');
      expect(calls[0][0].metadata?.isBatched).toBe(true);
      expect(calls[0][0].metadata?.batchCount).toBe(2);

      expect(calls[1][0].payload.rowId).toBe('4');
      expect(calls[1][0].metadata?.isBatched).toBe(true);
      expect(calls[1][0].metadata?.batchCount).toBe(4);
    });

    it('should work with different batch sizes', async () => {
      const bus = createEventBus();
      const handler = vi.fn();

      // Create batch middleware that lets through every 3rd event
      const batchMiddleware = createSimpleBatchMiddleware({ batchSize: 3 });

      bus.use(batchMiddleware);
      bus.on('test:event', handler);

      // Emit 5 events
      for (let i = 1; i <= 5; i++) {
        bus.emit('test:event', { value: i } as any);
      }

      await waitForAsync();

      // Only 3rd event should pass through (every 3rd)
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].payload.value).toBe(3);
    });
  });

  describe('Simple Debounce Middleware', () => {
    it('should debounce rapid events', async () => {
      const bus = createEventBus();
      const handler = vi.fn();

      // Create debounce middleware
      const debounceMiddleware = createSimpleDebounceMiddleware();

      bus.use(debounceMiddleware);
      bus.on('grid:init', handler);

      // Emit multiple events quickly
      bus.emit('grid:init', { gridId: createGridId('1') });
      bus.emit('grid:init', { gridId: createGridId('2') });
      bus.emit('grid:init', { gridId: createGridId('3') });

      await waitForAsync();

      // Only first event should pass through
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].payload.gridId).toBe('1');
    });

    it('should allow new events after debounce period', async () => {
      const bus = createEventBus();
      const handler = vi.fn();

      const debounceMiddleware = createSimpleDebounceMiddleware();

      bus.use(debounceMiddleware);
      bus.on('grid:update', handler);

      // First event
      bus.emit('grid:update', { gridId: createGridId('first') });
      await waitForAsync();

      // Wait longer than debounce period
      await new Promise((resolve) => setTimeout(resolve, 15));

      // Second event after debounce period
      bus.emit('grid:update', { gridId: createGridId('second') });
      await waitForAsync();

      // Both events should pass (separated by enough time)
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler.mock.calls[0][0].payload.gridId).toBe('first');
      expect(handler.mock.calls[1][0].payload.gridId).toBe('second');
    });
  });

  describe('Throttle Middleware', () => {
    it('should throttle events', async () => {
      const bus = createEventBus();
      const handler = vi.fn();

      // Create throttle middleware with 20ms interval
      const throttleMiddleware = createSimpleThrottleMiddleware(20);

      bus.use(throttleMiddleware);
      bus.on('scroll:update', handler);

      // First event - should pass
      bus.emit('scroll:update', { position: 0 } as any);
      await waitForAsync();

      // Second event immediately after - should be throttled
      bus.emit('scroll:update', { position: 10 } as any);
      await waitForAsync();

      // Wait for throttle interval
      await new Promise((resolve) => setTimeout(resolve, 25));

      // Third event after interval - should pass
      bus.emit('scroll:update', { position: 20 } as any);
      await waitForAsync();

      // Only first and third events should pass
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler.mock.calls[0][0].payload.position).toBe(0);
      expect(handler.mock.calls[1][0].payload.position).toBe(20);
    });

    it('should respect different throttle intervals', async () => {
      const bus = createEventBus();
      const handler = vi.fn();

      // Create throttle with 50ms interval
      const throttleMiddleware = createSimpleThrottleMiddleware(50);

      bus.use(throttleMiddleware);
      bus.on('resize', handler);

      const startTime = Date.now();

      // Emit events at different intervals
      bus.emit('resize', { width: 100 } as any);
      await waitForAsync();

      await new Promise((resolve) => setTimeout(resolve, 30)); // 30ms later
      bus.emit('resize', { width: 200 } as any);
      await waitForAsync();

      await new Promise((resolve) => setTimeout(resolve, 30)); // 60ms total
      bus.emit('resize', { width: 300 } as any);
      await waitForAsync();

      // Should get: event1 (t=0), event3 (t=60ms)
      // event2 at t=30ms should be throttled (50ms interval)
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler.mock.calls[0][0].payload.width).toBe(100);
      expect(handler.mock.calls[1][0].payload.width).toBe(300);
    });
  });

  describe('Multiple Middleware', () => {
    it('should apply middleware in order', async () => {
      const bus = createEventBus();
      const handler = vi.fn();

      // Create multiple middleware
      const batchMiddleware = createSimpleBatchMiddleware({ batchSize: 2 });
      const debounceMiddleware = createSimpleDebounceMiddleware();

      // Apply batch first, then debounce
      bus.use(batchMiddleware);
      bus.use(debounceMiddleware);

      bus.on('test:multi', handler);

      // Emit 4 events quickly
      bus.emit('test:multi', { id: '1' } as any);
      bus.emit('test:multi', { id: '2' } as any); // Batch lets this through
      bus.emit('test:multi', { id: '3' } as any);
      bus.emit('test:multi', { id: '4' } as any); // Batch lets this through

      await waitForAsync();

      // Batch lets through events 2 and 4
      // Debounce only lets through first (event 2)
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].payload.id).toBe('2');
    });
  });

  describe('Middleware Removal', () => {
    it('should allow removing middleware', async () => {
      const bus = createEventBus();
      const handler = vi.fn();

      const batchMiddleware = createSimpleBatchMiddleware({ batchSize: 2 });

      // Add middleware
      const removeMiddleware = bus.use(batchMiddleware);
      bus.on('test:remove', handler);

      // Emit 2 events - only 2nd should pass
      bus.emit('test:remove', { id: '1' } as any);
      bus.emit('test:remove', { id: '2' } as any);
      await waitForAsync();

      expect(handler).toHaveBeenCalledTimes(1);

      // Remove middleware
      removeMiddleware();

      // Reset handler
      handler.mockClear();

      // Emit 2 more events - both should pass now
      bus.emit('test:remove', { id: '3' } as any);
      bus.emit('test:remove', { id: '4' } as any);
      await waitForAsync();

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });
});
