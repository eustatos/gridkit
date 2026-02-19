// EventValidator.ts - Validates event payloads for security and type safety

import type { GridEvent } from '../events/PluginEvents';

/**
 * Event validation results
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Event validation options
 */
export interface ValidationOptions {
  /** Maximum payload size in bytes */
  maxPayloadSize?: number;
  /** Maximum number of event handlers */
  maxHandlers?: number;
  /** Allowed event types pattern */
  allowedEvents?: RegExp;
  /** Required event properties */
  requiredProperties?: string[];
}

/**
 * Event validator for plugin event system
 */
export class EventValidator {
  private options: ValidationOptions;

  constructor(options: ValidationOptions = {}) {
    this.options = {
      maxPayloadSize: options.maxPayloadSize ?? 1024 * 1024, // 1MB default
      maxHandlers: options.maxHandlers ?? 1000,
      allowedEvents: options.allowedEvents,
      requiredProperties: options.requiredProperties ?? ['type', 'payload'],
    };
  }

  /**
   * Validate an event payload
   * @param event - The event to validate
   * @returns Validation result
   */
  validateEvent(event: GridEvent): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required properties
    if (!event.type) {
      errors.push('Event type is required');
    }

    if (!event.payload) {
      errors.push('Event payload is required');
    }

    // Check payload size
    const payloadSize = JSON.stringify(event.payload).length;
    if (payloadSize > this.options.maxPayloadSize) {
      errors.push(`Event payload exceeds maximum size of ${this.options.maxPayloadSize} bytes`);
    }

    // Check event type against allowed pattern
    if (this.options.allowedEvents && !this.options.allowedEvents.test(event.type)) {
      errors.push(`Event type '${event.type}' is not allowed`);
    }

    // Check for security issues
    if (this.hasSecurityIssues(event.payload)) {
      errors.push('Event payload contains security-sensitive data');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Sanitize an event payload by removing sensitive data
   * @param event - The event to sanitize
   * @returns Sanitized event or null if the event should be rejected
   */
  sanitizeEvent(event: GridEvent): GridEvent | null {
    if (!event.payload) {
      return null;
    }

    // Deep clone to avoid mutation
    const sanitizedPayload = this.sanitizeObject(event.payload as Record<string, unknown>);

    return {
      ...event,
      payload: sanitizedPayload,
    };
  }

  /**
   * Recursively sanitize an object
   * @param obj - The object to sanitize
   * @returns Sanitized object
   */
  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveKey(key)) {
        // Redact sensitive data
        sanitized[key] = '[REDACTED]';
      } else if (value && typeof value === 'object') {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if a key is sensitive
   * @param key - The key to check
   * @returns true if the key is sensitive
   */
  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      'password',
      'token',
      'secret',
      'key',
      'credit',
      'ssn',
      'routing',
    ];

    const lowerKey = key.toLowerCase();
    return sensitivePatterns.some((pattern) => lowerKey.includes(pattern));
  }

  /**
   * Check if the payload has security issues
   * @param payload - The payload to check
   * @returns true if the payload has security issues
   */
  private hasSecurityIssues(payload: unknown): boolean {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    // Check for circular references (security risk)
    try {
      JSON.stringify(payload);
    } catch (error) {
      return true;
    }

    // Check for function types (security risk)
    const payloadStr = JSON.stringify(payload);
    if (payloadStr.includes('function') || payloadStr.includes('=>')) {
      return true;
    }

    return false;
  }
}
