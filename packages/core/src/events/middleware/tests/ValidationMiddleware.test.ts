// ValidationMiddleware.test.ts

import { createValidationMiddleware } from '../builtin/ValidationMiddleware';
import { GridEvent } from '../core/EventPipeline';

describe('ValidationMiddleware', () => {
  test('should pass valid event', () => {
    const schema = { name: { required: true } };
    const middleware = createValidationMiddleware(schema);
    const event: GridEvent = { type: 'test', payload: { name: 'John' } };

    const result = middleware(event);

    expect(result).toEqual(event);
  });

  test('should cancel event with missing required field', () => {
    const schema = { name: { required: true } };
    const middleware = createValidationMiddleware(schema);
    const event: GridEvent = { type: 'test', payload: {} };

    const result = middleware(event);

    expect(result).toBeNull();
  });

  test('should pass event with optional field missing', () => {
    const schema = { name: { required: false } };
    const middleware = createValidationMiddleware(schema);
    const event: GridEvent = { type: 'test', payload: {} };

    const result = middleware(event);

    expect(result).toEqual(event);
  });
});