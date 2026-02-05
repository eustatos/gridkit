// Namespace extraction utilities for GridKit Event System

/**
 * Extracts the namespace from an event type string
 * @param eventType - The full event type string (e.g., "grid.created")
 * @returns The namespace part (e.g., "grid") or empty string if no namespace
 */
export function extractNamespace(eventType: string): string {
  const parts = eventType.split('.');
  return parts.length > 1 ? parts[0] ?? '' : '';
}

/**
 * Checks if an event type belongs to a specific namespace
 * @param eventType - The full event type string
 * @param namespace - The namespace to check against
 * @returns True if the event belongs to the namespace
 */
export function isInNamespace(eventType: string, namespace: string): boolean {
  return eventType.startsWith(`${namespace}.`);
}

/**
 * Removes the namespace from an event type string
 * @param eventType - The full event type string
 * @returns The event name without namespace
 */
export function removeNamespace(eventType: string): string {
  const parts = eventType.split('.');
  return parts.length > 1 ? parts.slice(1).join('.') : eventType;
}