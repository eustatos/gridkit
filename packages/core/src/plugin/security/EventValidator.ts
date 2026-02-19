// EventValidator.ts - Validates event payloads for security and type safety

import type { GridEvent } from '../events/PluginEvents';

/**
 * Event validation results
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  /** First error message for convenience */
  errorMessage?: string;
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

    // Validate event type
    if (event.type && typeof event.type !== 'string') {
      errors.push('Event type must be a string');
    }

    // Validate payload
    if (event.payload !== undefined && event.payload !== null) {
      const payloadType = typeof event.payload;
      if (payloadType !== 'object' && payloadType !== 'function') {
        errors.push('Event payload must be an object');
      }
    }

    // Validate source
    if (event.source !== undefined && event.source !== null) {
      if (typeof event.source !== 'string') {
        errors.push('Event source must be a string');
      }
    }

    // Validate timestamp
    if (event.timestamp !== undefined && event.timestamp !== null) {
      if (typeof event.timestamp !== 'number') {
        errors.push('Event timestamp must be a number');
      }
    }

    // Validate metadata
    if (event.metadata !== undefined && event.metadata !== null) {
      if (typeof event.metadata !== 'object' || Array.isArray(event.metadata)) {
        errors.push('Event metadata must be an object');
      }
    }

    // Check payload size
    if (event.payload) {
      const payloadSize = JSON.stringify(event.payload).length;
      if (payloadSize > this.options.maxPayloadSize) {
        errors.push(`Event payload exceeds maximum size of ${this.options.maxPayloadSize} bytes`);
      }
    }

    // Check event type against allowed pattern
    if (this.options.allowedEvents && event.type && !this.options.allowedEvents.test(event.type)) {
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
      errorMessage: errors.length > 0 ? errors[0] : undefined,
    };
  }

  /**
   * Sanitize an event payload by removing sensitive data
   * @param event - The event to sanitize
   * @returns Sanitized event or null if the event should be rejected
   */
  sanitizeEvent(event: GridEvent): GridEvent | null {
    // Handle null and undefined payload
    if (event.payload === undefined || event.payload === null) {
      const sanitizedMetadata = event.metadata
        ? this.sanitizeObject(event.metadata)
        : event.metadata;
      
      return {
        ...event,
        payload: event.payload,
        metadata: sanitizedMetadata,
      };
    }

    // Deep clone to avoid mutation
    const sanitizedPayload = this.sanitizeObject(event.payload);
    const sanitizedMetadata = event.metadata
      ? this.sanitizeObject(event.metadata)
      : event.metadata;

    return {
      ...event,
      payload: sanitizedPayload,
      metadata: sanitizedMetadata,
    };
  }

  /**
   * Recursively sanitize an object
   * @param obj - The object to sanitize
   * @returns Sanitized object
   */
  private sanitizeObject(obj: unknown): unknown {
    // Handle null and undefined
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    // Handle primitives
    if (typeof obj !== 'object') {
      return obj;
    }

    // Sanitize objects
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check for dangerous properties
      if (this.isDangerousProperty(key)) {
        // Skip dangerous properties entirely
        continue;
      }
      
      if (value && typeof value === 'object') {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if a property is dangerous (proto, constructor, prototype)
   * @param key - The key to check
   * @returns true if the key is dangerous
   */
  private isDangerousProperty(key: string): boolean {
    const dangerousPatterns = [
      '__proto__',
      'constructor',
      'prototype',
    ];

    return dangerousPatterns.includes(key);
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
