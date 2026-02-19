import { describe, test, expect } from 'vitest';
import { GridKitError } from '../../errors/grid-kit-error';
import { validateNotDestroyed } from '../utils/validation';

describe('validation utilities', () => {
  describe('validateNotDestroyed', () => {
    test('does not throw when not destroyed', () => {
      expect(() => validateNotDestroyed(false)).not.toThrow();
    });

    test('throws GridKitError when destroyed', () => {
      expect(() => validateNotDestroyed(true)).toThrow(GridKitError);
    });

    test('throws error with correct code', () => {
      try {
        validateNotDestroyed(true);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GridKitError);
        if (error instanceof GridKitError) {
          expect(error.code).toBe('STORE_DESTROYED');
        }
      }
    });

    test('throws error with descriptive message', () => {
      try {
        validateNotDestroyed(true);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GridKitError);
        if (error instanceof GridKitError) {
          expect(error.message).toContain('destroyed');
          expect(error.message).toContain('Cannot use store after destroy()');
        }
      }
    });

    test('includes timestamp in details', () => {
      try {
        validateNotDestroyed(true);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GridKitError);
        if (error instanceof GridKitError) {
          expect(error.context).toBeDefined();
          expect(error.context).toHaveProperty('timestamp');
          expect(typeof error.context.timestamp).toBe('number');
        }
      }
    });
  });
});
