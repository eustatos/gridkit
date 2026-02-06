// ThrottleMiddleware.test.ts

import { createThrottleMiddleware } from '../builtin/ThrottleMiddleware';
import { GridEvent } from '../core/EventPipeline';

vi.useFakeTimers();

describe('ThrottleMiddleware', () => {
  test('should allow first event', () => {
    const middleware = createThrottleMiddleware(100);
    const event: GridEvent = { type: 'test' };

    const result = middleware(event);

    expect(result).toEqual(event);
  });

  test('should cancel events within throttle delay', () => {
    const middleware = createThrottleMiddleware(100);
    const event: GridEvent = { type: 'test' };

    middleware(event); // First event allowed
    const result = middleware(event); // Second event within delay

    expect(result).toBeNull();
  });

  test('should allow event after throttle delay', () => {
    const middleware = createThrottleMiddleware(100);
    const event: GridEvent = { type: 'test' };

    middleware(event); // First event allowed
    vi.advanceTimersByTime(150);
    const result = middleware(event); // Event after delay

    expect(result).toEqual(event);
  });

  test('should handle different event types separately', () => {
    const middleware = createThrottleMiddleware(100);
    const event1: GridEvent = { type: 'test1' };
    const event2: GridEvent = { type: 'test2' };

    const result1 = middleware(event1);
    const result2 = middleware(event2);

    expect(result1).toEqual(event1);
    expect(result2).toEqual(event2);
  });
});