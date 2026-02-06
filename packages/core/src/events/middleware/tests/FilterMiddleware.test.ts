// FilterMiddleware.test.ts

import { createFilterMiddleware } from '../builtin/FilterMiddleware';
import { GridEvent } from '../core/EventPipeline';

describe('FilterMiddleware', () => {
  test('should allow events that match predicate', () => {
    const middleware = createFilterMiddleware((event) => event.type === 'allowed');
    const event: GridEvent = { type: 'allowed' };

    const result = middleware(event);

    expect(result).toEqual(event);
  });

  test('should cancel events that do not match predicate', () => {
    const middleware = createFilterMiddleware((event) => event.type === 'allowed');
    const event: GridEvent = { type: 'denied' };

    const result = middleware(event);

    expect(result).toBeNull();
  });

  test('should handle complex predicates', () => {
    const middleware = createFilterMiddleware(
      (event) => event.payload?.priority === 'high'
    );
    const event: GridEvent = { type: 'test', payload: { priority: 'high' } };

    const result = middleware(event);

    expect(result).toEqual(event);
  });
});