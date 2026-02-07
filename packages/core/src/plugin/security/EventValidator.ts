import type { GridEvent } from '../../events/PluginEvents';

/**
 * ValidationResult represents the result of event validation.
 */
export interface ValidationResult {
  /** Whether the event is valid */
  isValid: boolean;
  
  /** Error message if the event is invalid */
  errorMessage?: string;
  
  /** Sanitized event payload if the event can be sanitized */
  sanitizedPayload?: unknown;
}

/**
 * EventValidator handles payload validation and sanitization for events
 * to prevent security issues and malformed data.
 * 
 * The event validator ensures that events conform to expected formats
 * and removes potentially dangerous content from event payloads.
 * It provides both validation and sanitization capabilities.
 * 
 * @example
 * ```typescript
 * const validator = new EventValidator();
 * const result = validator.validateEvent(event);
 * if (!result.isValid) {
 *   console.error(`Invalid event: ${result.errorMessage}`);
 * }
 * 
 * const sanitizedEvent = validator.sanitizeEvent(event);
 * if (sanitizedEvent) {
 *   // Use the sanitized event
 * }
 * ```
 */
export class EventValidator {
  /**
   * Validates an event payload.
   * 
   * This method checks if an event conforms to expected formats
   * and contains valid data. It verifies required fields and
   * proper data types.
   * 
   * @param event - The event to validate
   * @returns Validation result
   * 
   * @example
   * ```typescript
   * const result = validator.validateEvent(event);
   * if (!result.isValid) {
   *   console.error(`Invalid event: ${result.errorMessage}`);
   * }
   * ```
   */
  public validateEvent(event: GridEvent): ValidationResult {
    // Check for required fields
    if (!event.type) {
      return {
        isValid: false,
        errorMessage: 'Event type is required',
      };
    }

    // Check for valid source format
    if (event.source && typeof event.source !== 'string') {
      return {
        isValid: false,
        errorMessage: 'Event source must be a string',
      };
    }

    // Check for valid timestamp
    if (event.timestamp && typeof event.timestamp !== 'number') {
      return {
        isValid: false,
        errorMessage: 'Event timestamp must be a number',
      };
    }

    // Check for valid metadata
    if (event.metadata && typeof event.metadata !== 'object') {
      return {
        isValid: false,
        errorMessage: 'Event metadata must be an object',
      };
    }

    // Additional validation can be added here based on event type
    return {
      isValid: true,
    };
  }

  /**
   * Sanitizes an event payload to remove potentially harmful content.
   * 
   * This method removes potentially dangerous properties from
   * event payloads and metadata to prevent security issues.
   * It creates a copy of the event to avoid modifying the original.
   * 
   * @param event - The event to sanitize
   * @returns Sanitized event or null if the event should be rejected
   * 
   * @example
   * ```typescript
   * const sanitizedEvent = validator.sanitizeEvent(event);
   * if (sanitizedEvent) {
   *   // Use the sanitized event
   * }
   * ```
   */
  public sanitizeEvent(event: GridEvent): GridEvent | null {
    // Create a copy of the event to avoid modifying the original
    const sanitizedEvent: GridEvent = {
      type: event.type,
      payload: this.sanitizePayload(event.payload),
      timestamp: event.timestamp,
      source: event.source,
      metadata: event.metadata ? this.sanitizeMetadata(event.metadata) : undefined,
    };

    return sanitizedEvent;
  }

  /**
   * Sanitizes event payload.
   * 
   * This method recursively sanitizes event payloads by removing
   * potentially dangerous properties and ensuring data integrity.
   * 
   * @param payload - The payload to sanitize
   * @returns Sanitized payload
   * 
   * @example
   * ```typescript
   * const sanitizedPayload = this.sanitizePayload(payload);
   * ```
   */
  private sanitizePayload(payload: unknown): unknown {
    if (payload === null || payload === undefined) {
      return payload;
    }

    // For objects, recursively sanitize properties
    if (typeof payload === 'object') {
      // Handle arrays
      if (Array.isArray(payload)) {
        return payload.map(item => this.sanitizePayload(item));
      }

      // Handle plain objects
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload)) {
        // Skip potentially dangerous properties
        if (this.isDangerousProperty(key)) {
          continue;
        }
        sanitized[key] = this.sanitizePayload(value);
      }
      return sanitized;
    }

    // For primitives, return as-is
    return payload;
  }

  /**
   * Sanitizes event metadata.
   * 
   * This method sanitizes event metadata by removing potentially
   * dangerous properties while preserving valid metadata.
   * 
   * @param metadata - The metadata to sanitize
   * @returns Sanitized metadata
   * 
   * @example
   * ```typescript
   * const sanitizedMetadata = this.sanitizeMetadata(metadata);
   * ```
   */
  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
      // Skip potentially dangerous properties
      if (this.isDangerousProperty(key)) {
        continue;
      }
      sanitized[key] = this.sanitizePayload(value);
    }
    return sanitized;
  }

  /**
   * Checks if a property name is potentially dangerous.
   * 
   * This method checks if a property name is potentially dangerous
   * and should be removed during sanitization. Dangerous properties
   * include those that could be used for prototype pollution.
   * 
   * @param propertyName - The property name to check
   * @returns true if the property is dangerous, false otherwise
   * 
   * @example
   * ```typescript
   * if (this.isDangerousProperty(key)) {
   *   // Skip this property
   * }
   * ```
   */
  private isDangerousProperty(propertyName: string): boolean {
    // List of potentially dangerous property names
    const dangerousProperties = [
      '__proto__',
      'constructor',
      'prototype',
    ];

    return dangerousProperties.includes(propertyName);
  }
}