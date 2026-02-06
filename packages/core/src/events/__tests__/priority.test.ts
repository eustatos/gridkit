import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEventBus, type EventBus, resetEventBus } from '../EventBus';
import { EventPriority } from '../types';

// Mock branded types for testing
const createGridId = (id: string) => id as any;

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

describe('Event Priority', () => {
  let bus: EventBus;

  beforeEach(() => {
    // Use the global reset for consistency
    resetEventBus();
    bus = createEventBus({ devMode: false });
  });

  it('should process events in priority order', async () => {
    const order: number[] = [];

    // Subscribe handlers with different priorities
    bus.on('grid:init', () => order.push(1), { priority: EventPriority.HIGH });
    bus.on('grid:init', () => order.push(2), {
      priority: EventPriority.NORMAL,
    });
    bus.on('grid:init', () => order.push(3), { priority: EventPriority.LOW });

    // Emit event - this will queue handlers
    bus.emit('grid:init', { gridId: createGridId('test') });

    // Wait for async processing to complete
    await flushMicrotasks();

    // HIGH executes first, then NORMAL, then LOW
    expect(order).toEqual([1, 2, 3]);
  });

  it('should execute IMMEDIATE priority synchronously', async () => {
    const order: string[] = [];

    // Note: The priority option in on() is for handler priority, not event priority
    // Event priority is specified in emit()
    bus.on('test:low', () => order.push('low'));
    bus.on('test:normal', () => order.push('normal'));
    bus.on('test:handler', () => order.push('handler'));

    // Emit low priority event
    bus.emit('test:low', {}, { priority: EventPriority.LOW });

    // Emit normal priority event
    bus.emit('test:normal', {});

    // Emit immediate priority event - should execute synchronously
    bus.emit('test:handler', {}, { priority: EventPriority.IMMEDIATE });

    // This should appear AFTER the immediate handler but BEFORE async handlers
    order.push('after-emit');

    // Wait for async processing of LOW and NORMAL events
    await flushMicrotasks();

    // Order should be:
    // 1. IMMEDIATE handler (synchronous)
    // 2. 'after-emit' (synchronous, after emit completes)
    // 3. NORMAL handler (async, next tick)
    // 4. LOW handler (async, next tick, after NORMAL)
    expect(order).toEqual(['handler', 'after-emit', 'normal', 'low']);
  });

  it('should handle mixed priorities correctly', async () => {
    const timestamps: Record<string, number> = {};
    const order: string[] = [];

    // Create multiple events with different priorities
    bus.on('test:immediate', () => {
      timestamps.immediate = performance.now();
      order.push('immediate');
    });

    bus.on('test:high', () => {
      timestamps.high = performance.now();
      order.push('high');
    });

    bus.on('test:normal', () => {
      timestamps.normal = performance.now();
      order.push('normal');
    });

    bus.on('test:low', () => {
      timestamps.low = performance.now();
      order.push('low');
    });

    // Emit events in reverse priority order
    bus.emit('test:low', {}, { priority: EventPriority.LOW });
    bus.emit('test:normal', {}, { priority: EventPriority.NORMAL });
    bus.emit('test:high', {}, { priority: EventPriority.HIGH });
    bus.emit('test:immediate', {}, { priority: EventPriority.IMMEDIATE });

    // Wait for async processing
    await flushMicrotasks();

    // Check execution order
    expect(order).toEqual(['immediate', 'high', 'normal', 'low']);

    // Check timestamps (only if all handlers executed)
    if (timestamps.immediate && timestamps.high) {
      expect(timestamps.immediate).toBeLessThan(timestamps.high);
    }
    if (timestamps.high && timestamps.normal) {
      expect(timestamps.high).toBeLessThan(timestamps.normal);
    }
    if (timestamps.normal && timestamps.low) {
      expect(timestamps.normal).toBeLessThan(timestamps.low);
    }
  });

  it('should maintain order within same priority', async () => {
    const order: string[] = [];

    // Add multiple handlers with same priority
    bus.on('test:event', () => order.push('handler1'));
    bus.on('test:event', () => order.push('handler2'));
    bus.on('test:event', () => order.push('handler3'));

    bus.emit('test:event', {});

    await flushMicrotasks();

    // Handlers should execute in order of registration
    expect(order).toEqual(['handler1', 'handler2', 'handler3']);
  });

  it('should handle multiple events with different priorities', async () => {
    const executionLog: string[] = [];

    // Set up handlers for different events
    bus.on('event:a', () => executionLog.push('a-low'), {
      priority: EventPriority.LOW,
    });
    bus.on('event:b', () => executionLog.push('b-normal'), {
      priority: EventPriority.NORMAL,
    });
    bus.on('event:c', () => executionLog.push('c-high'), {
      priority: EventPriority.HIGH,
    });
    bus.on('event:d', () => executionLog.push('d-immediate'), {
      priority: EventPriority.IMMEDIATE,
    });

    // Emit events in mixed order
    bus.emit('event:a', {}, { priority: EventPriority.LOW });
    bus.emit('event:b', {}, { priority: EventPriority.NORMAL });
    bus.emit('event:c', {}, { priority: EventPriority.HIGH });
    bus.emit('event:d', {}, { priority: EventPriority.IMMEDIATE });

    // Immediate should execute synchronously
    expect(executionLog).toContain('d-immediate');

    // Wait for async events
    await flushMicrotasks();

    // Check that order respects priorities
    const immediateIndex = executionLog.indexOf('d-immediate');
    const highIndex = executionLog.indexOf('c-high');
    const normalIndex = executionLog.indexOf('b-normal');
    const lowIndex = executionLog.indexOf('a-low');

    expect(immediateIndex).toBeLessThan(highIndex);
    expect(highIndex).toBeLessThan(normalIndex);
    expect(normalIndex).toBeLessThan(lowIndex);
  });

  it('should handle async handlers correctly', async () => {
    const order: string[] = [];
    const asyncMock = vi.fn();

    bus.on(
      'test:async',
      async () => {
        order.push('async-start');
        await Promise.resolve();
        asyncMock();
        order.push('async-end');
      },
      { priority: EventPriority.HIGH }
    );

    bus.on(
      'test:sync',
      () => {
        order.push('sync');
      },
      { priority: EventPriority.NORMAL }
    );

    // Emit events
    bus.emit('test:async', {});
    bus.emit('test:sync', {});

    // Wait for all async operations
    await flushMicrotasks();
    // Extra flush to ensure all promises resolve
    await flushMicrotasks();

    // Async handlers shouldn't block execution of other handlers
    expect(order).toEqual(['async-start', 'sync', 'async-end']);
    expect(asyncMock).toHaveBeenCalled();
  });

  it('should process batch emissions in priority order', async () => {
    const order: string[] = [];

    // Set up handlers
    bus.on('batch:event', (event) => {
      order.push(`handler-${(event.payload as any).id}`);
    });

    // Emit batch with mixed priorities
    bus.emitBatch([
      {
        event: 'batch:event',
        payload: { id: 'low' },
        priority: EventPriority.LOW,
      },
      {
        event: 'batch:event',
        payload: { id: 'high' },
        priority: EventPriority.HIGH,
      },
      {
        event: 'batch:event',
        payload: { id: 'normal' },
        priority: EventPriority.NORMAL,
      },
      {
        event: 'batch:event',
        payload: { id: 'immediate' },
        priority: EventPriority.IMMEDIATE,
      },
    ]);

    // Immediate should execute synchronously
    expect(order).toContain('handler-immediate');

    // Wait for async processing
    await flushMicrotasks();

    // Check order (excluding immediate which we already checked)
    const remainingOrder = order.filter((item) => item !== 'handler-immediate');
    expect(remainingOrder).toEqual([
      'handler-high',
      'handler-normal',
      'handler-low',
    ]);
  });
});
