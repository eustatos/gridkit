// helpers.test.ts

import { createConditionalMiddleware } from '../utils/helpers';
import { GridEvent } from '../core/EventPipeline';

describe('helpers', () => {
  describe('createConditionalMiddleware', () => {
    test('should apply middleware when condition is true', () => {
      const condition = (event: GridEvent) => event.type === 'allowed';
      const middleware = jest.fn((event: GridEvent) => {
        return { ...event, processed: true };
      });

      const conditional = createConditionalMiddleware(condition, middleware);
      const event: GridEvent = { type: 'allowed' };

      const result = conditional(event);

      expect(middleware).toHaveBeenCalledWith(event);
      expect(result).toEqual({ ...event, processed: true });
    });

    test('should skip middleware when condition is false', () => {
      const condition = (event: GridEvent) => event.type === 'allowed';
      const middleware = jest.fn((event: GridEvent) => {
        return { ...event, processed: true };
      });

      const conditional = createConditionalMiddleware(condition, middleware);
      const event: GridEvent = { type: 'denied' };

      const result = conditional(event);

      expect(middleware).not.toHaveBeenCalled();
      expect(result).toEqual(event);
    });

    test('should cancel event when condition is true and middleware cancels', () => {
      const condition = (event: GridEvent) => event.type === 'cancel';
      const canceller = () => null;

      const conditional = createConditionalMiddleware(condition, canceller);
      const event: GridEvent = { type: 'cancel' };

      const result = conditional(event);

      expect(result).toBeNull();
    });

    test('should handle complex conditions', () => {
      const condition = (event: GridEvent) =>
        event.payload?.priority === 'high';
      const middleware = jest.fn((event: GridEvent) => {
        return { ...event, processed: true };
      });

      const conditional = createConditionalMiddleware(condition, middleware);
      const event: GridEvent = {
        type: 'test',
        payload: { priority: 'high' },
      };

      const result = conditional(event);

      expect(middleware).toHaveBeenCalledWith(event);
      expect(result).toEqual({ ...event, processed: true });
    });
  });
});