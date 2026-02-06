// types.test.ts

import { MiddlewareResult, EventContext } from '../utils/types';
import { GridEvent } from '../core/EventPipeline';

describe('types', () => {
  describe('MiddlewareResult', () => {
    test('should accept GridEvent', () => {
      const result: MiddlewareResult = { type: 'test' };
      expect(result).toBeDefined();
    });

    test('should accept null', () => {
      const result: MiddlewareResult = null;
      expect(result).toBeNull();
    });

    test('should accept Promise<GridEvent>', async () => {
      const result: MiddlewareResult = Promise.resolve({ type: 'test' });
      expect(result).toBeDefined();
    });

    test('should accept Promise<null>', async () => {
      const result: MiddlewareResult = Promise.resolve(null);
      expect(result).toBeDefined();
    });
  });

  describe('EventContext', () => {
    test('should have event property', () => {
      const context: EventContext = {
        event: { type: 'test' },
        cancel: () => {},
        isCancelled: () => false,
      };
      expect(context.event).toEqual({ type: 'test' });
    });

    test('should have cancel method', () => {
      const context: EventContext = {
        event: { type: 'test' },
        cancel: vi.fn(),
        isCancelled: () => false,
      };
      context.cancel();
      expect(context.cancel).toHaveBeenCalled();
    });

    test('should have isCancelled method', () => {
      const context: EventContext = {
        event: { type: 'test' },
        cancel: () => {},
        isCancelled: vi.fn(() => false),
      };
      const result = context.isCancelled();
      expect(context.isCancelled).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});