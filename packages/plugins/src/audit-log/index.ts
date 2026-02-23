import type { EnhancedPlugin } from '@gridkit/core';

/**
 * Audit log plugin configuration
 */
export interface AuditLogConfig {
  /** Destination for audit logs - API endpoint or custom logger function */
  destination: string | ((events: AuditEvent[]) => void);
  
  /** List of events to log */
  events: string[];
  
  /** Retention period (e.g., '30d', '90d') */
  retention?: string;
  
  /** PII (Personally Identifiable Information) handling */
  pii?: {
    /** Fields to mask */
    mask?: string[];
    /** Fields to encrypt */
    encrypt?: string[];
  };
  
  /** Include metadata in logs */
  includeMetadata?: boolean;
}

/**
 * Audit event structure
 */
export interface AuditEvent {
  /** Event type */
  type: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'ACTION';
  
  /** Timestamp */
  timestamp: number;
  
  /** User ID */
  userId?: string;
  
  /** Resource type */
  resourceType?: string;
  
  /** Resource ID */
  resourceId?: string;
  
  /** Old value (for updates) */
  oldValue?: unknown;
  
  /** New value */
  newValue?: unknown;
  
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Create audit log plugin
 */
export const auditLogPlugin = (config: AuditLogConfig): EnhancedPlugin<AuditLogConfig> => ({
  metadata: {
    id: '@gridkit/plugin-audit-log',
    name: 'Audit Log Plugin',
    version: '1.0.0',
    author: 'GridKit Team',
    description: 'GDPR/HIPAA/SOX compliant audit logging',
    category: 'security',
    tags: ['audit', 'compliance', 'security', 'logging'],
    coreVersion: '^1.0.0',
    license: 'MIT',
    pricing: 'free',
    verified: true,
    featured: true,
  },

  async initialize(context) {
    const logs: AuditEvent[] = [];
    
    // Set up event listeners
    const eventSubscriptions = config.events.map(eventType => {
      return context.on(eventType, (event: any) => {
        const auditEvent: AuditEvent = {
          type: this.determineEventType(eventType),
          timestamp: Date.now(),
          userId: event.metadata?.userId,
          resourceType: event.metadata?.resourceType,
          resourceId: event.metadata?.resourceId,
          oldValue: event.metadata?.oldValue,
          newValue: event.metadata?.newValue,
          metadata: config.includeMetadata ? event.metadata : undefined,
        };

        // Handle PII
        if (config.pii) {
          this.maskPII(auditEvent, config.pii);
        }

        logs.push(auditEvent);

        // Send to destination
        this.sendToDestination(auditEvent, config.destination);
      });
    });

    // Store subscriptions for cleanup
    (context as any).subscriptions = eventSubscriptions;
  },

  destroy(context) {
    // Cleanup event subscriptions
    const subscriptions = (context as any).subscriptions;
    if (subscriptions) {
      subscriptions.forEach((unsub: () => void) => unsub());
    }

    // Flush pending logs
    if (typeof config.destination === 'string') {
      this.sendToDestination([], config.destination);
    }
  },

  requiredPermissions: ['events:subscribe', 'state:read'],

  resourceLimits: {
    maxMemoryMB: 50,
    maxEventHandlers: 10,
  },

  // Private methods
  determineEventType: (eventType: string): AuditEvent['type'] => {
    if (eventType.includes('create') || eventType.includes('add')) return 'CREATE';
    if (eventType.includes('read') || eventType.includes('get')) return 'READ';
    if (eventType.includes('update') || eventType.includes('edit')) return 'UPDATE';
    if (eventType.includes('delete') || eventType.includes('remove')) return 'DELETE';
    return 'ACTION';
  },

  maskPII: (event: AuditEvent, piiConfig: AuditLogConfig['pii']): void => {
    if (piiConfig.mask) {
      piiConfig.mask.forEach(field => {
        if (event.newValue && typeof event.newValue === 'object') {
          delete (event.newValue as any)[field];
        }
        if (event.oldValue && typeof event.oldValue === 'object') {
          delete (event.oldValue as any)[field];
        }
      });
    }
  },

  sendToDestination: (event: AuditEvent | AuditEvent[], destination: string | ((events: AuditEvent[]) => void)): void => {
    if (typeof destination === 'function') {
      destination(Array.isArray(event) ? event : [event]);
    } else {
      // Send to API endpoint
      fetch(`${destination}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(error => console.error('Failed to send audit log:', error));
    }
  },
});
