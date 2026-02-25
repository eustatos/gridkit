import type { EnhancedPlugin } from '@gridkit/core';

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  /** Analytics provider */
  provider: 'mixpanel' | 'amplitude' | 'ga' | 'segment';
  
  /** API key for the provider */
  apiKey?: string;
  
  /** Auto-track common events */
  autoTrack?: boolean;
  
  /** Custom event mapping */
  customEvents?: Record<string, string>;
  
  /** User identifier */
  userId?: string;
  
  /** Session tracking */
  sessionTracking?: boolean;
  
  /** Custom properties to track */
  customProperties?: Record<string, unknown>;
}

/**
 * Tracker interface for different providers
 */
interface Tracker {
  identify: (userId: string, properties?: Record<string, unknown>) => void;
  track: (event: string, properties?: Record<string, unknown>) => void;
  setSession: (sessionId: string) => void;
}

/**
 * Create analytics plugin
 */
export const analyticsPlugin = (config: AnalyticsConfig) => {
  // Tracker implementations
  const createTracker = (config: AnalyticsConfig): Tracker => {
    switch (config.provider) {
      case 'mixpanel':
        return createMixpanelTracker(config.apiKey);
      case 'amplitude':
        return createAmplitudeTracker(config.apiKey);
      case 'ga':
        return createGATracker(config.apiKey);
      case 'segment':
        return createSegmentTracker(config.apiKey);
      default:
        return createConsoleTracker();
    }
  };

  const setupAutoTracking = (context: any, tracker: Tracker, config: AnalyticsConfig): void => {
    (context as any).eventBus.on('row:select', (event: any) => {
      tracker.track('Table Row Selected', {
        rowId: event.payload?.rowId,
        timestamp: Date.now(),
      });
    });

    (context as any).eventBus.on('row:deselect', (event: any) => {
      tracker.track('Table Row Deselected', {
        rowId: event.payload?.rowId,
        timestamp: Date.now(),
      });
    });

    (context as any).eventBus.on('filter:apply', (event: any) => {
      tracker.track('Table Filter Applied', {
        filterCount: event.payload?.filters?.length || 0,
        timestamp: Date.now(),
      });
    });

    (context as any).eventBus.on('sort:change', (event: any) => {
      tracker.track('Table Sort Changed', {
        column: event.payload?.column,
        direction: event.payload?.direction,
        timestamp: Date.now(),
      });
    });

    (context as any).eventBus.on('page:change', (event: any) => {
      tracker.track('Table Page Changed', {
        currentPage: event.payload?.currentPage,
        pageSize: event.payload?.pageSize,
        timestamp: Date.now(),
      });
    });
  };

  // Provider-specific tracker implementations
  const createMixpanelTracker = (apiKey?: string): Tracker => ({
    identify: (userId: string, properties?: Record<string, unknown>) => {
      console.log('[Mixpanel] Identify:', userId, properties);
    },
    track: (event: string, properties?: Record<string, unknown>) => {
      console.log('[Mixpanel] Track:', event, properties);
    },
    setSession: (sessionId: string) => {
      console.log('[Mixpanel] Set session:', sessionId);
    },
  });

  const createAmplitudeTracker = (apiKey?: string): Tracker => ({
    identify: (userId: string, properties?: Record<string, unknown>) => {
      console.log('[Amplitude] Identify:', userId, properties);
    },
    track: (event: string, properties?: Record<string, unknown>) => {
      console.log('[Amplitude] Track:', event, properties);
    },
    setSession: (sessionId: string) => {
      console.log('[Amplitude] Set session:', sessionId);
    },
  });

  const createGATracker = (apiKey?: string): Tracker => ({
    identify: (userId: string, properties?: Record<string, unknown>) => {
      console.log('[GA] Identify:', userId, properties);
    },
    track: (event: string, properties?: Record<string, unknown>) => {
      console.log('[GA] Track:', event, properties);
    },
    setSession: (sessionId: string) => {
      console.log('[GA] Set session:', sessionId);
    },
  });

  const createSegmentTracker = (apiKey?: string): Tracker => ({
    identify: (userId: string, properties?: Record<string, unknown>) => {
      console.log('[Segment] Identify:', userId, properties);
    },
    track: (event: string, properties?: Record<string, unknown>) => {
      console.log('[Segment] Track:', event, properties);
    },
    setSession: (sessionId: string) => {
      console.log('[Segment] Set session:', sessionId);
    },
  });

  const createConsoleTracker = (): Tracker => ({
    identify: (userId: string, properties?: Record<string, unknown>) => {
      console.log('[Console Tracker] Identify:', userId, properties);
    },
    track: (event: string, properties?: Record<string, unknown>) => {
      console.log('[Console Tracker] Track:', event, properties);
    },
    setSession: (sessionId: string) => {
      console.log('[Console Tracker] Set session:', sessionId);
    },
  });

  // Main plugin object
  return {
    metadata: {
      id: '@gridkit/plugin-analytics',
      name: 'Analytics Plugin',
      version: '1.0.0',
      author: 'GridKit Team',
      description: 'Track user interactions with popular analytics providers',
      category: 'analytics',
      tags: ['analytics', 'tracking', 'metrics'],
      coreVersion: '^1.0.0',
      license: 'MIT',
      pricing: 'free',
      verified: true,
      featured: true,
    },

    async initialize(_config: AnalyticsConfig, context: any) {
      const tracker = createTracker(config);

      // Auto-track common events
      if (config.autoTrack) {
        setupAutoTracking(context, tracker, config);
      }

      // Setup custom event mapping
      if (config.customEvents) {
        Object.entries(config.customEvents).forEach(([eventType, trackingName]) => {
          (context as any).eventBus.on(eventType, (event: any) => {
            tracker.track(trackingName, event.payload);
          });
        });
      }

      // Set user if provided
      if (config.userId) {
        tracker.identify(config.userId, config.customProperties);
      }

      // Store tracker for external access
      (context as any).tracker = tracker;
    },

    destroy() {
      // Cleanup
    },

    requiredPermissions: ['events:subscribe'],

    // Create tracker for different providers
    createTracker,

    // Auto-tracking setup
    setupAutoTracking,

    // Provider-specific tracker implementations
    createMixpanelTracker,
    createAmplitudeTracker,
  };
};

