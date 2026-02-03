/**
 * Namespace extraction utilities.
 * 
 * @module @gridkit/core/events/utils/namespace
 */

import type { EventNamespace } from '../types';

/**
 * Extract namespace from event name.
 * 
 * @param event - Event type string
 * @returns Event namespace
 * 
 * @example
 * ```typescript
 * extractNamespace('row:add') // 'row'
 * extractNamespace('column-group:toggle') // 'column-group'
 * extractNamespace('custom:my-event') // 'custom'
 * ```
 * 
 * @public
 */
export function extractNamespace(event: string): EventNamespace {
  const [namespace] = event.split(':');

  // Validate known namespaces
  const validNamespaces: EventNamespace[] = [
    'grid',
    'column',
    'column-group',
    'row',
    'cell',
    'selection',
    'virtualization',
    'sorting',
    'filtering',
    'validation',
    'config',
    'plugin',
    'custom',
  ];

  if (validNamespaces.includes(namespace as EventNamespace)) {
    return namespace as EventNamespace;
  }

  // Default to custom for unknown namespaces
  return 'custom';
}

/**
 * Validate if namespace is valid.
 * 
 * @param namespace - Namespace to validate
 * @returns True if namespace is valid
 * 
 * @public
 */
export function isValidNamespace(namespace: string): namespace is EventNamespace {
  const validNamespaces: EventNamespace[] = [
    'grid',
    'column',
    'column-group',
    'row',
    'cell',
    'selection',
    'virtualization',
    'sorting',
    'filtering',
    'validation',
    'config',
    'plugin',
    'custom',
  ];
  
  return validNamespaces.includes(namespace as EventNamespace);
}

/**
 * Get event name without namespace.
 * 
 * @param event - Full event type
 * @returns Event name without namespace
 * 
 * @example
 * ```typescript
 * getEventName('row:add') // 'add'
 * getEventName('column-group:toggle') // 'toggle'
 * ```
 * 
 * @public
 */
export function getEventName(event: string): string {
  return event.split(':')[1] || event;
}