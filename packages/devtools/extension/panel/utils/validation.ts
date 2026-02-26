// Input Validation Utilities

import type { DevToolsEvent } from '../types/events';

/**
 * Check if value is a plain object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is a valid timestamp
 */
function isValidTimestamp(value: unknown): boolean {
  if (typeof value !== 'number') return false;
  if (value < 0) return false;
  if (value > Date.now() + 10000) return false; // Allow slight future drift
  return true;
}

/**
 * Validate table data structure
 */
export function isValidTableData(data: unknown): boolean {
  if (!isObject(data)) return false;

  const requiredFields = ['id', 'rowCount', 'columnCount'];
  for (const field of requiredFields) {
    if (!(field in data)) return false;
  }

  if (typeof data.id !== 'string') return false;
  if (typeof data.rowCount !== 'number' || data.rowCount < 0) return false;
  if (typeof data.columnCount !== 'number' || data.columnCount < 0) return false;

  return true;
}

/**
 * Validate event data structure
 */
export function isValidEvent(event: unknown): boolean {
  if (!isObject(event)) return false;

  const requiredFields = ['id', 'type', 'tableId', 'timestamp', 'payload'];
  for (const field of requiredFields) {
    if (!(field in event)) return false;
  }

  if (typeof event.id !== 'string') return false;
  if (typeof event.type !== 'string') return false;
  if (typeof event.tableId !== 'string') return false;
  if (!isValidTimestamp(event.timestamp)) return false;
  if (!isObject(event.payload)) return false;

  return true;
}

/**
 * Validate event array
 */
export function isValidEventArray(events: unknown): events is DevToolsEvent[] {
  if (!Array.isArray(events)) return false;
  return events.every((event) => isValidEvent(event));
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

/**
 * Sanitize object (remove non-serializable properties)
 */
export function sanitizeObject(obj: unknown): Record<string, unknown> {
  if (!isObject(obj)) return {};

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip functions and symbols
    if (typeof value === 'function' || typeof value === 'symbol') {
      continue;
    }

    // Handle dates
    if (value instanceof Date) {
      result[key] = value.toISOString();
      continue;
    }

    // Handle nested objects
    if (isObject(value) || Array.isArray(value)) {
      result[key] = sanitizeObject(value);
      continue;
    }

    // Handle primitives
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null ||
      value === undefined
    ) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Validate bridge message
 */
export function isValidBridgeMessage(message: unknown): boolean {
  if (!isObject(message)) return false;

  const requiredFields = ['type', 'source', 'timestamp'];
  for (const field of requiredFields) {
    if (!(field in message)) return false;
  }

  if (typeof message.type !== 'string') return false;
  if (typeof message.source !== 'string') return false;
  if (!isValidTimestamp(message.timestamp)) return false;

  return true;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    const parsed = JSON.parse(json) as T;
    return parsed;
  } catch (error) {
    console.warn('[Validation] Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Safe JSON stringify with error handling
 */
export function safeJsonStringify(value: unknown, fallback = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('[Validation] Failed to stringify value:', error);
    return fallback;
  }
}

/**
 * Get type name for debugging
 */
export function getTypeName(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
