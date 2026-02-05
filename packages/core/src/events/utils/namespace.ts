import type { EventNamespace } from '../types';

/**
 * Extract namespace from event name
 *
 * @example
 * extractNamespace('row:add') // 'row'
 * extractNamespace('column-group:toggle') // 'column-group'
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
    'state',
    'data',
    'custom',
  ];

  if (validNamespaces.includes(namespace as EventNamespace)) {
    return namespace as EventNamespace;
  }

  // Default to custom for unknown namespaces
  return 'custom';
}