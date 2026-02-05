import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from '../EventBus';
import { createBatchMiddleware } from '../middleware/batch';
import { createDebounceMiddleware } from '../middleware/debounce';

// Mock branded types for testing
const createRowId = (id: string) => id as any;
const createGridId = (id: string) => id as any;

describe('Event Middleware', () => {
  describe('Batch Middleware', () => {
    it('should batch events within time window', async () => {
      const bus = createEventBus();
      const handler = vi.fn();
      
      // Create batch middleware with 10ms window and max size of 3
      const batchMiddleware = createBatchMiddleware({
        window: 10,
        maxSize: 3,
      });
      
      bus.use(batchMiddleware);
      bus.on('row:add', handler);
      
      // Emit 2 events quickly (should be batched)
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
      
      // Wait for batch window to expire
      await new Promise(resolve => setTimeout(resolve, 15));
      
      // Handler should be called for both events
      expect(handler).toHaveBeenCalledTimes(2);
    });
    
    it('should flush when max size is reached', () => {
      const bus = createEventBus();
      const handler = vi.fn();
      
      // Create batch middleware with 100ms window and max size of 2
      const batchMiddleware = createBatchMiddleware({
        window: 100,
        maxSize: 2,
      });
      
      bus.use(batchMiddleware);
      bus.on('row:add', handler);
      
      // Emit 2 events (should flush immediately due to max size)
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
      
      // Handler should be called for both events immediately
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('Debounce Middleware', () => {
    it('should debounce events', async () => {
      const bus = createEventBus();
      const handler = vi.fn();
      
      // Create debounce middleware with 20ms delay
      const debounceMiddleware = createDebounceMiddleware(20);
      
      bus.use(debounceMiddleware);
      bus.on('grid:init', handler);
      
      // Emit multiple events quickly
      bus.emit('grid:init', { gridId: createGridId('1') });
      bus.emit('grid:init', { gridId: createGridId('2') });
      bus.emit('grid:init', { gridId: createGridId('3') });
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 25));
      
      // Handler should only be called once (for the last event)
      expect(handler).toHaveBeenCalledTimes(1);
      
      // Check that the last event was processed
      const event = handler.mock.calls[0][0];
      expect(event.payload.gridId).toBe('3');
    });
  });
});