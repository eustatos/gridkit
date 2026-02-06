// LoggingMiddleware.test.ts

import { createLoggingMiddleware } from '../builtin/LoggingMiddleware';
import { GridEvent } from '../core/EventPipeline';

describe('LoggingMiddleware', () => {
  test('should log event type', () => {
    const logger = vi.fn();
    const middleware = createLoggingMiddleware(logger);
    const event: GridEvent = { type: 'test' };

    const result = middleware(event);

    expect(logger).toHaveBeenCalledWith('Event: test');
    expect(result).toEqual(event);
  });

  test('should pass through the event unchanged', () => {
    const logger = vi.fn();
    const middleware = createLoggingMiddleware(logger);
    const event: GridEvent = { type: 'test', payload: { data: 'test' } };

    const result = middleware(event);

    expect(result).toEqual(event);
  });
});