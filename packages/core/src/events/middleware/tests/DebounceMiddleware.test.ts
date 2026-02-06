// DebounceMiddleware.test.ts

import { createDebounceMiddleware } from '../builtin/DebounceMiddleware';
import { GridEvent } from '../core/EventPipeline';

vi.useFakeTimers();

describe('DebounceMiddleware', () => {
  test('should cancel events within debounce delay', () => {
    const middleware = createDebounceMiddleware(100);
    const event: GridEvent = { type: 'test' };

    const result1 = middleware(event);
    vi.advanceTimersByTime(50);
    const result2 = middleware(event);

    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });

  test('should allow event after debounce delay', () => {
    const middleware = createDebounceMiddleware(100);
    const event: GridEvent = { type: 'test' };

    const result1 = middleware(event);
    vi.advanceTimersByTime(150);
    const result2 = middleware(event);

    expect(result1).toBeNull();
    expect(result2).toEqual(event);
  });

  test('should allow leading event when leading option is true', () => {
    const middleware = createDebounceMiddleware(100, { leading: true });
    const event: GridEvent = { type: 'test' };

    const result1 = middleware(event);
    const result2 = middleware(event);

    expect(result1).toEqual(event);
    expect(result2).toBeNull();
  });

  test('should allow leading event again after delay', () => {
    const middleware = createDebounceMiddleware(100, { leading: true });
    const event: GridEvent = { type: 'test' };

    const result1 = middleware(event);
    vi.advanceTimersByTime(150);
    const result2 = middleware(event);

    expect(result1).toEqual(event);
    expect(result2).toEqual(event);
  });
});