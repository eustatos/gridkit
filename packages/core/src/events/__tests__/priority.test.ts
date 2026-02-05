import { describe, it, expect, vi } from 'vitest';
import { createEventBus, type EventBus } from '../EventBus';
import { EventPriority } from '../types';

// Mock branded types for testing
const createGridId = (id: string) => id as any;

describe('Event Priority', () => {
  let bus: EventBus;
  
  beforeEach(() => {
    bus = createEventBus({ devMode: false });
  });
  
  it('should process events in priority order', async () => {
    const order: number[] = [];
    
    // Subscribe handlers with different priorities
    bus.on('grid:init', () => order.push(3), { priority: EventPriority.LOW });
    bus.on('grid:init', () => order.push(1), { priority: EventPriority.HIGH });
    bus.on('grid:init', () => order.push(2), { priority: EventPriority.NORMAL });
    
    // Emit event
    bus.emit('grid:init', { gridId: createGridId('test') });
    
    // Wait for all events to process
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Events should be processed in priority order
    expect(order).toEqual([1, 2, 3]);
  });
  
  it('should execute IMMEDIATE priority synchronously', () => {
    const order: string[] = [];
    
    bus.on('grid:init', () => order.push('low'), { priority: EventPriority.LOW });
    bus.on('grid:init', () => order.push('handler'), { priority: EventPriority.IMMEDIATE });
    bus.on('grid:init', () => order.push('normal'), { priority: EventPriority.NORMAL });
    
    bus.emit('grid:init', { gridId: createGridId('test') });
    order.push('after-emit');
    
    // IMMEDIATE priority should execute synchronously before anything else
    expect(order).toEqual(['handler', 'after-emit', 'normal', 'low']);
  });
  
  it('should handle mixed priorities correctly', async () => {
    const timestamps: Record<string, number> = {};
    
    bus.on('grid:init', () => {
      timestamps.immediate = performance.now();
    }, { priority: EventPriority.IMMEDIATE });
    
    bus.on('grid:init', () => {
      timestamps.high = performance.now();
    }, { priority: EventPriority.HIGH });
    
    bus.on('grid:init', () => {
      timestamps.normal = performance.now();
    }, { priority: EventPriority.NORMAL });
    
    bus.on('grid:init', () => {
      timestamps.low = performance.now();
    }, { priority: EventPriority.LOW });
    
    bus.emit('grid:init', { gridId: createGridId('test') });
    
    // Wait for all events to process
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Check that timestamps are in correct order
    expect(timestamps.immediate).toBeLessThan(timestamps.high);
    expect(timestamps.high).toBeLessThan(timestamps.normal);
    expect(timestamps.normal).toBeLessThan(timestamps.low);
  });
});