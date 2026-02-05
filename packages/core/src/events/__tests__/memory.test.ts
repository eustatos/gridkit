import { describe, it, expect, vi } from 'vitest';
import { createEventBus, getEventBus, resetEventBus } from '../EventBus';

// Mock branded types for testing
const createGridId = (id: string) => id as any;

describe('Memory Management', () => {
  it('should cleanup handlers on clear', () => {
    const bus = createEventBus();
    const handler = vi.fn();
    
    // Add multiple handlers
    bus.on('grid:init', handler);
    bus.on('grid:ready', handler);
    bus.on('grid:destroy', handler);
    
    // Check initial state
    expect(bus.getStats().totalHandlers).toBe(3);
    
    // Clear all handlers
    bus.clear();
    
    // Check that handlers were removed
    expect(bus.getStats().totalHandlers).toBe(0);
    
    // Emit events to verify handlers are gone
    bus.emit('grid:init', { gridId: createGridId('test') });
    bus.emit('grid:ready', { 
      gridId: createGridId('test'), 
      timestamp: Date.now(), 
      meta: {} as any 
    });
    bus.emit('grid:destroy', { gridId: createGridId('test') });
    
    // Handler should not be called after clear
    expect(handler).not.toHaveBeenCalled();
  });
  
  it('should cleanup singleton instance on reset', () => {
    // Get singleton instance
    const bus = getEventBus();
    
    // Add a handler
    const handler = vi.fn();
    bus.on('grid:init', handler);
    
    // Check initial state
    expect(bus.getStats().totalHandlers).toBe(1);
    
    // Reset the singleton instance
    resetEventBus();
    
    // Get new instance
    const newBus = getEventBus();
    
    // Check that handlers were removed
    expect(newBus.getStats().totalHandlers).toBe(0);
    
    // Emit event to verify handler is gone
    newBus.emit('grid:init', { gridId: createGridId('test') });
    
    // Handler should not be called after reset
    expect(handler).not.toHaveBeenCalled();
  });
  
  it('should not leak memory with many subscriptions', () => {
    const bus = createEventBus();
    const handlers: Array<() => void> = [];
    
    // Create many subscriptions
    for (let i = 0; i < 1000; i++) {
      const handler = vi.fn();
      const unsubscribe = bus.on('grid:init', handler);
      handlers.push(unsubscribe);
    }
    
    // Check initial state
    expect(bus.getStats().totalHandlers).toBe(1000);
    
    // Unsubscribe half of them manually
    for (let i = 0; i < 500; i++) {
      handlers[i]();
    }
    
    // Check that handlers were removed
    expect(bus.getStats().totalHandlers).toBe(500);
    
    // Clear remaining handlers
    bus.clear();
    
    // Check final state
    expect(bus.getStats().totalHandlers).toBe(0);
  });
  
  it('should cleanup middleware on clear', () => {
    const bus = createEventBus();
    const middleware = vi.fn((event) => event);
    
    // Add middleware
    bus.use(middleware);
    
    // Emit event to verify middleware is called
    bus.emit('grid:init', { gridId: createGridId('test') });
    expect(middleware).toHaveBeenCalledTimes(1);
    
    // Clear everything
    bus.clear();
    
    // Reset mock to clear call count
    middleware.mockClear();
    
    // Emit event again
    bus.emit('grid:init', { gridId: createGridId('test') });
    
    // Middleware should not be called after clear
    expect(middleware).not.toHaveBeenCalled();
  });
});