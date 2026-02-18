import { EventBus, EventPriority } from '../../events';
import type { GridEvent } from '../../events/types/base';

/**
 * EventSandbox provides isolated event handling for plugins.
 * Each plugin gets its own sandboxed event bus with permission-based filtering.
 * 
 * @example
 * ```typescript
 * const sandbox = new EventSandbox('my-plugin', baseBus, ['read:data', 'emit:events']);
 * const localBus = sandbox.getBus();
 * localBus.on('my-event', (event) => {
 *   console.log('Received event:', event);
 * });
 * ```
 */
export class EventSandbox {
  private pluginId: string;
  private baseBus: EventBus;
  private localBus = new EventBus();
  private permissions: Set<string>;

  /**
   * Creates a new event sandbox for a plugin.
   * @param pluginId - The unique identifier for the plugin
   * @param baseBus - The base event bus to forward approved events to
   * @param permissions - The permissions granted to this plugin
   * 
   * @example
   * ```typescript
   * const sandbox = new EventSandbox('plugin-1', eventBus, ['read:data', 'write:config']);
   * ```
   */
  constructor(pluginId: string, baseBus: EventBus, permissions: string[]) {
    this.pluginId = pluginId;
    this.baseBus = baseBus;
    this.permissions = new Set(permissions);

    // Forward approved events from plugin to base bus
    this.localBus.on('*', (event) => {
      // Prevent infinite loop: don't forward events already from base bus
      if (event.source && event.source.startsWith('plugin:')) {
        return;
      }
      
      const checkPermission = this.hasPermission(`emit:${event.type}`);
      if (checkPermission) {
        const sandboxedEvent = this.sandboxEvent(event);
        this.baseBus.emit(sandboxedEvent.type, sandboxedEvent.payload, {
          priority: EventPriority.IMMEDIATE,
          source: sandboxedEvent.source,
          metadata: sandboxedEvent.metadata,
        });
      }
    });

    // Forward approved events from base bus to plugin
    this.baseBus.on('*', (event) => {
      // Prevent infinite loop: don't forward sandboxed events back to plugin
      if (event.metadata?.sandboxed) {
        return;
      }
      
      if (this.canReceiveEvent(event.type)) {
        this.localBus.emit(event.type, event.payload, {
          priority: EventPriority.IMMEDIATE,
        });
      }
    });
  }

  /**
   * Checks if the plugin has permission to perform an action.
   * Supports exact matches and wildcard patterns (e.g., 'receive:*' matches 'receive:test').
   * @param permission - The permission to check
   * @returns true if the plugin has the permission, false otherwise
   * 
   * @example
   * ```typescript
   * // Exact match
   * const hasPermission = sandbox.hasPermission('read:data');
   * 
   * // Wildcard match - 'receive:*' matches 'receive:test'
   * const hasWildcard = sandbox.hasPermission('receive:test');
   * // Returns true if permissions include 'receive:*' or '*'
   * ```
   */
  private hasPermission(permission: string): boolean {
    // Exact match
    if (this.permissions.has(permission)) {
      return true;
    }
    
    // Global wildcard matches everything
    if (this.permissions.has('*')) {
      return true;
    }
    
    // Check for pattern matches (e.g., 'receive:*' matches 'receive:test')
    for (const perm of this.permissions) {
      if (perm.endsWith(':*')) {
        const prefix = perm.slice(0, perm.indexOf(':*'));
        if (permission.startsWith(prefix + ':')) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Checks if the plugin can receive a specific event type.
   * @param eventType - The type of event to check
   * @returns true if the plugin can receive the event, false otherwise
   * 
   * @example
   * ```typescript
   * const canReceive = sandbox.canReceiveEvent('data-update');
   * ```
   */
  private canReceiveEvent(eventType: string): boolean {
    // Plugins can receive events they have permission for
    return this.hasPermission(`receive:${eventType}`) || this.hasPermission('*');
  }

  /**
   * Safely sanitizes event payload to prevent code injection.
   * Removes functions, symbols, and other non-serializable data.
   * Handles circular references using WeakSet.
   * @param payload - The payload to sanitize
   * @param seen - WeakSet for tracking circular references (internal)
   * @returns Sanitized payload
   */
  private sanitizePayload(payload: any, seen: WeakSet<any> = new WeakSet()): any {
    // Handle null/undefined
    if (payload === null || payload === undefined) {
      return payload;
    }

    // Handle primitives
    if (typeof payload !== 'object') {
      return payload;
    }

    // Handle circular references
    if (seen.has(payload)) {
      return '<Circular Reference>'; // Prevent infinite loop
    }
    seen.add(payload);

    // Handle Date
    if (payload instanceof Date) {
      return payload;
    }

    // Handle Error
    if (payload instanceof Error) {
      return {
        name: payload.name,
        message: payload.message,
        stack: payload.stack,
      };
    }

    // Handle Promise (convert to string to prevent execution)
    if (payload instanceof Promise) {
      return '<Promise>'; // Prevent async execution
    }

    // Handle Buffer/TypedArray (Node.js specific)
    if (Buffer && Buffer.isBuffer(payload)) {
      return payload.toString(); // Convert to string
    }

    // Handle Array
    if (Array.isArray(payload)) {
      return payload.map(item => this.sanitizePayload(item, seen));
    }

    // Handle plain object - remove functions, symbols, and non-serializable properties
    const sanitized: Record<string, any> = {};
    
    for (const key in payload) {
      // Skip prototype properties
      if (!Object.prototype.hasOwnProperty.call(payload, key)) {
        continue;
      }

      const value = payload[key];

      // Skip symbols
      if (typeof key === 'symbol') {
        continue;
      }

      // Skip functions
      if (typeof value === 'function') {
        continue;
      }

      // Skip async functions
      if (value instanceof Function && value.constructor && value.constructor.name === 'AsyncFunction') {
        continue;
      }

      // Recursively sanitize nested objects
      sanitized[key] = this.sanitizePayload(value, seen);
    }

    return sanitized;
  }

  /**
   * Wraps an event with sandbox metadata.
   * @param event - The event to sandbox
   * @returns The sandboxed event
   * 
   * @example
   * ```typescript
   * const sandboxedEvent = sandbox.sandboxEvent(event);
   * ```
   */
  private sandboxEvent(event: GridEvent): GridEvent {
    // Sanitize payload to prevent code injection
    const sanitizedPayload = this.sanitizePayload(event.payload);

    return {
      ...event,
      source: `plugin:${this.pluginId}`,
      metadata: {
        ...event.metadata,
        sandboxed: true,
        pluginId: this.pluginId,
      },
      payload: sanitizedPayload,
    };
  }

  /**
   * Gets the local event bus for this plugin.
   * @returns The local event bus
   * 
   * @example
   * ```typescript
   * const localBus = sandbox.getBus();
   * localBus.on('my-event', handler);
   * ```
   */
  public getBus(): EventBus {
    return this.localBus;
  }

  /**
   * Cleans up the event sandbox, removing all event listeners.
   * 
   * @example
   * ```typescript
   * sandbox.destroy();
   * ```
   */
  public destroy(): void {
    this.localBus.clear();
    // Note: We don't clear the baseBus listeners as they're managed elsewhere
  }
}