import { describe, it, expect, beforeEach } from 'vitest';
import { EventValidator } from '../security/EventValidator';

describe('EventValidator', () => {
  let eventValidator: EventValidator;

  beforeEach(() => {
    eventValidator = new EventValidator();
  });

  describe('validateEvent', () => {
    it('should validate a valid event', () => {
      const event = {
        type: 'test-event',
        payload: { data: 'test' },
        timestamp: Date.now(),
      };

      const result = eventValidator.validateEvent(event as any);

      expect(result.isValid).toBe(true);
    });

    it('should reject an event without a type', () => {
      const event = {
        payload: { data: 'test' },
        timestamp: Date.now(),
      };

      const result = eventValidator.validateEvent(event as any);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Event type is required');
    });

    it('should reject an event with invalid source', () => {
      const event = {
        type: 'test-event',
        payload: { data: 'test' },
        timestamp: Date.now(),
        source: 123, // Invalid source type
      };

      const result = eventValidator.validateEvent(event as any);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Event source must be a string');
    });

    it('should reject an event with invalid timestamp', () => {
      const event = {
        type: 'test-event',
        payload: { data: 'test' },
        timestamp: 'invalid', // Invalid timestamp type
      };

      const result = eventValidator.validateEvent(event as any);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Event timestamp must be a number');
    });

    it('should reject an event with invalid metadata', () => {
      const event = {
        type: 'test-event',
        payload: { data: 'test' },
        timestamp: Date.now(),
        metadata: 'invalid', // Invalid metadata type
      };

      const result = eventValidator.validateEvent(event as any);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Event metadata must be an object');
    });
  });

  describe('sanitizeEvent', () => {
    it('should sanitize a valid event', () => {
      const event = {
        type: 'test-event',
        payload: { data: 'test' },
        timestamp: Date.now(),
        source: 'test-source',
        metadata: { key: 'value' },
      };

      const sanitizedEvent = eventValidator.sanitizeEvent(event as any);

      expect(sanitizedEvent).toEqual(event);
    });

    it('should sanitize event payload', () => {
      const event = {
        type: 'test-event',
        payload: {
          data: 'test',
          __proto__: { dangerous: 'value' },
          constructor: { dangerous: 'value' },
          prototype: { dangerous: 'value' },
        },
        timestamp: Date.now(),
      };

      const sanitizedEvent = eventValidator.sanitizeEvent(event as any);

      expect(sanitizedEvent).toBeDefined();
      expect(sanitizedEvent!.payload).toEqual({ data: 'test' });
    });

    it('should sanitize event metadata', () => {
      const event = {
        type: 'test-event',
        payload: { data: 'test' },
        timestamp: Date.now(),
        metadata: {
          key: 'value',
          __proto__: { dangerous: 'value' },
          constructor: { dangerous: 'value' },
          prototype: { dangerous: 'value' },
        },
      };

      const sanitizedEvent = eventValidator.sanitizeEvent(event as any);

      expect(sanitizedEvent).toBeDefined();
      expect(sanitizedEvent!.metadata).toEqual({ key: 'value' });
    });

    it('should handle array payloads', () => {
      const event = {
        type: 'test-event',
        payload: [
          { data: 'test1' },
          { data: 'test2', __proto__: { dangerous: 'value' } },
        ],
        timestamp: Date.now(),
      };

      const sanitizedEvent = eventValidator.sanitizeEvent(event as any);

      expect(sanitizedEvent).toBeDefined();
      expect(sanitizedEvent!.payload).toEqual([
        { data: 'test1' },
        { data: 'test2' },
      ]);
    });

    it('should handle null and undefined values', () => {
      const event = {
        type: 'test-event',
        payload: null,
        timestamp: Date.now(),
      };

      const sanitizedEvent = eventValidator.sanitizeEvent(event as any);

      expect(sanitizedEvent).toBeDefined();
      expect(sanitizedEvent!.payload).toBeNull();
    });
  });

  describe('isDangerousProperty', () => {
    it('should identify dangerous properties', () => {
      // This is a private method, but we can test it indirectly
      const event = {
        type: 'test-event',
        payload: {
          data: 'test',
          __proto__: { dangerous: 'value' },
          constructor: { dangerous: 'value' },
          prototype: { dangerous: 'value' },
        },
        timestamp: Date.now(),
      };

      const sanitizedEvent = eventValidator.sanitizeEvent(event as any);

      expect(sanitizedEvent).toBeDefined();
      expect(sanitizedEvent!.payload).toEqual({ data: 'test' });
    });
  });
});