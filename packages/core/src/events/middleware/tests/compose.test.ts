// compose.test.ts

import { composeMiddlewares } from '../utils/compose';
import { GridEvent } from '../core/EventPipeline';

describe('composeMiddlewares', () => {
  test('should compose single middleware', () => {
    const middleware = (event: GridEvent) => ({ ...event, processed: true });
    const composed = composeMiddlewares(middleware);
    
    const event: GridEvent = { type: 'test' };
    const result = composed(event);
    
    expect(result).toEqual({ ...event, processed: true });
  });

  test('should compose multiple middlewares in correct order', () => {
    const middleware1 = (event: GridEvent) => ({ ...event, step: 1 });
    const middleware2 = (event: GridEvent) => ({ ...event, step: 2 });
    const middleware3 = (event: GridEvent) => ({ ...event, step: 3 });
    
    const composed = composeMiddlewares(middleware1, middleware2, middleware3);
    
    const event: GridEvent = { type: 'test' };
    const result = composed(event);
    
    expect(result).toEqual({ ...event, step: 3 });
  });

  test('should handle event cancellation (null return)', () => {
    const canceller = () => null;
    const nextMiddleware = (event: GridEvent) => ({ ...event, processed: true });
    
    const composed = composeMiddlewares(canceller, nextMiddleware);
    
    const event: GridEvent = { type: 'test' };
    const result = composed(event);
    
    expect(result).toBeNull();
  });

  test('should handle null event from first middleware', () => {
    const firstCanceller = () => null;
    const secondMiddleware = (event: GridEvent) => ({ ...event, processed: true });
    
    const composed = composeMiddlewares(firstCanceller, secondMiddleware);
    
    const event: GridEvent = { type: 'test' };
    const result = composed(event);
    
    expect(result).toBeNull();
  });

  test('should pass modified event through chain', () => {
    const modifier1 = (event: GridEvent) => ({ ...event, value: 'modified1' });
    const modifier2 = (event: GridEvent) => ({ ...event, value: 'modified2' });
    
    const composed = composeMiddlewares(modifier1, modifier2);
    
    const event: GridEvent = { type: 'test' };
    const result = composed(event);
    
    expect(result).toEqual({ ...event, value: 'modified2' });
  });
});