/**
 * Analytics Middleware
 * 
 * Tracks events for analytics providers.
 * 
 * @module @gridkit/core/events/middleware/enhanced/analytics
 */

import type { EnhancedMiddleware, AnalyticsMiddlewareOptions } from './types';

/**
 * Create analytics middleware
 * 
 * @param options - Analytics options
 * @returns Analytics middleware
 */
export function createAnalyticsMiddleware(
  options: AnalyticsMiddlewareOptions = {}
): EnhancedMiddleware {
  const {
    provider = 'custom',
    eventMap = [],
    userId,
    trackAll = true,
    track,
  } = options;

  // Create event map for quick lookup
  const eventMapLookup = new Map(
    eventMap.map((m) => [m.gridEvent, m])
  );

  // Default track function (noop)
  const trackFn = track || ((event: string, properties?: unknown) => {
    // No-op if no track function provided
  });

  return {
    name: 'analytics',
    version: '1.0.0',
    priority: 10, // Run after other middleware

    async handle(event, context) {
      // Get analytics event name
      const mapping = eventMapLookup.get(event.type);

      let analyticsEventName = mapping?.analyticsEvent || event.type;
      // Extract data from EnhancedEventPayload
      let analyticsPayload = mapping?.transform 
        ? mapping.transform((event.payload as any).data ?? event.payload) 
        : (event.payload as any).data ?? event.payload;

      // Add common properties
      const properties: Record<string, unknown> = {
        ...(analyticsPayload as any),
        eventId: event.eventId,
        timestamp: event.timestamp,
        source: event.source,
        type: event.type,
        provider,
      };

      // Add user ID if available
      if (userId) {
        properties.userId = userId;
      }

      // Track the event
      trackFn(analyticsEventName, properties);

      // If trackAll, also track the raw event
      if (trackAll && !mapping) {
        trackFn(`gridkit.${event.type}`, {
          ...properties,
          originalPayload: event.payload,
        });
      }

      return event;
    },
  };
}