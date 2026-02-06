import { describe, it, expect } from 'vitest';
import { createEventBus } from '../EventBus';
import { EventPriority } from '../types';

// Mock branded types for testing
const createRowId = (id: string) => id as any;
const createGridId = (id: string) => id as any;

describe('EventBus Performance', () => {
  it('should emit 10K events in < 150ms', () => {
    const bus = createEventBus();
    const handler = () => {};

    bus.on('row:add', handler);

    const start = performance.now();

    for (let i = 0; i < 10000; i++) {
      bus.emit(
        'row:add',
        {
          rowId: createRowId(`row-${i}`),
          index: i,
          isNew: true,
        },
        { priority: EventPriority.IMMEDIATE }
      );
    }

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(150);
  });

  it('should handle 1K handlers without degradation', () => {
    const bus = createEventBus();

    // Add 1K handlers
    for (let i = 0; i < 1000; i++) {
      bus.on('grid:init', () => {});
    }

    const start = performance.now();
    bus.emit(
      'grid:init',
      { gridId: createGridId('test') },
      {
        priority: EventPriority.IMMEDIATE,
      }
    );
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50);
  });

  it('should emit in < 0.1ms (p95)', () => {
    const bus = createEventBus();
    bus.on('grid:init', () => {});

    const times: number[] = [];

    // Run 100 times
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      bus.emit(
        'grid:init',
        { gridId: createGridId('test') },
        {
          priority: EventPriority.IMMEDIATE,
        }
      );
      times.push(performance.now() - start);
    }

    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)];

    expect(p95).toBeLessThan(0.1);
  });
});