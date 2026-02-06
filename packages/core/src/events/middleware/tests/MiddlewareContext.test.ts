// MiddlewareContext.test.ts

import { MiddlewareContext } from '../core/MiddlewareContext';

describe('MiddlewareContext', () => {
  let context: MiddlewareContext;

  beforeEach(() => {
    context = new MiddlewareContext();
  });

  test('should not be cancelled by default', () => {
    expect(context.isCancelled()).toBe(false);
  });

  test('should be cancelled after calling cancel', () => {
    context.cancel();
    expect(context.isCancelled()).toBe(true);
  });

  test('should remain cancelled after multiple cancel calls', () => {
    context.cancel();
    context.cancel();
    expect(context.isCancelled()).toBe(true);
  });

  test('should not be able to uncancel', () => {
    context.cancel();
    expect(context.isCancelled()).toBe(true);
    
    // There's no uncancel method, so it should remain cancelled
    expect(context.isCancelled()).toBe(true);
  });
});