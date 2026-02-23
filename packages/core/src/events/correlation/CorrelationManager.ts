/**
 * Correlation Manager
 * 
 * Manages event correlations for tracking related events across the system.
 * 
 * @module @gridkit/core/events/correlation
 */

import type { EnhancedTableEvent, EnhancedGridEvent, CorrelationManagerOptions, CorrelationRecord } from '@/events/types/enhanced';

/**
 * Correlation record with internal tracking
 */
interface InternalCorrelationRecord {
  correlationId: string;
  events: (EnhancedTableEvent | EnhancedGridEvent)[];
  createdAt: number;
  lastActivity: number;
  metadata: Record<string, unknown>;
  eventIds: Set<string>;
}

/**
 * Correlation Manager
 * 
 * Tracks correlations between events to enable:
 * - Request tracing
 * - User action sequences
 * - Related event grouping
 */
export class CorrelationManager {
  private correlations: Map<string, InternalCorrelationRecord> = new Map();
  private eventCorrelations: Map<string, string> = new Map();
  private options: Required<CorrelationManagerOptions>;
  private nextId = 0;

  constructor(options: CorrelationManagerOptions = {}) {
    this.options = {
      maxCorrelations: options.maxCorrelations ?? 1000,
      correlationHeader: options.correlationHeader ?? 'X-Correlation-ID',
      generateId: options.generateId ?? this.generateId.bind(this),
    };
  }

  /**
   * Generate a unique correlation ID
   * 
   * @returns Correlation ID
   */
  private generateId(): string {
    return `corr-${Date.now()}-${this.nextId++}`;
  }

  /**
   * Create a new correlation
   * 
   * @param metadata - Optional correlation metadata
   * @returns Correlation ID
   */
  createCorrelation(metadata?: Record<string, unknown>): string {
    const correlationId = this.options.generateId();
    
    const record: InternalCorrelationRecord = {
      correlationId,
      events: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
      metadata: metadata ?? {},
      eventIds: new Set(),
    };

    // Enforce max correlations
    if (this.correlations.size >= this.options.maxCorrelations) {
      this.evictOldest();
    }

    this.correlations.set(correlationId, record);
    return correlationId;
  }

  /**
   * Add event to a correlation
   * 
   * @param correlationId - Correlation ID
   * @param event - Event to add
   */
  addEvent(correlationId: string, event: EnhancedTableEvent | EnhancedGridEvent): void {
    const record = this.correlations.get(correlationId);
    if (!record) {
      return;
    }

    // Update last activity
    record.lastActivity = Date.now();

    // Only add event if it has an eventId (EnhancedGridEvent)
    if ('eventId' in event && event.eventId) {
      const eventId = event.eventId as string;
      if (!record.eventIds.has(eventId)) {
        record.eventIds.add(eventId);
        record.events.push(event);
      }

      // Track event -> correlation mapping
      this.eventCorrelations.set(eventId, correlationId);
    }
  }

  /**
   * Add event with automatic correlation creation
   * 
   * @param event - Event to add
   * @param metadata - Optional correlation metadata
   * @returns Correlation ID
   */
  trackEvent(event: EnhancedTableEvent | EnhancedGridEvent, metadata?: Record<string, unknown>): string {
    const correlationId = this.createCorrelation(metadata);
    this.addEvent(correlationId, event);
    return correlationId;
  }

  /**
   * Get events for a correlation
   * 
   * @param correlationId - Correlation ID
   * @returns Array of events
   */
  getRelatedEvents(correlationId: string): (EnhancedTableEvent | EnhancedGridEvent)[] {
    const record = this.correlations.get(correlationId);
    return record ? [...record.events] : [];
  }

  /**
   * Get correlation ID for an event
   * 
   * @param eventId - Event ID
   * @returns Correlation ID or undefined
   */
  getCorrelationForEvent(eventId: string): string | undefined {
    return this.eventCorrelations.get(eventId);
  }

  /**
   * Get correlation record
   * 
   * @param correlationId - Correlation ID
   * @returns Correlation record or undefined
   */
  getCorrelation(correlationId: string): CorrelationRecord | undefined {
    const record = this.correlations.get(correlationId);
    if (!record) return undefined;

    return {
      correlationId: record.correlationId,
      events: [...record.events] as EnhancedTableEvent[],
      createdAt: record.createdAt,
      lastActivity: record.lastActivity,
      metadata: record.metadata,
    };
  }

  /**
   * Get all correlations
   * 
   * @returns Array of correlation records
   */
  getAllCorrelations(): CorrelationRecord[] {
    return Array.from(this.correlations.values()).map((record) => ({
      correlationId: record.correlationId,
      events: [...record.events] as EnhancedTableEvent[],
      createdAt: record.createdAt,
      lastActivity: record.lastActivity,
      metadata: record.metadata,
    }));
  }

  /**
   * Clear a specific correlation
   * 
   * @param correlationId - Correlation ID
   */
  clearCorrelation(correlationId: string): void {
    const record = this.correlations.get(correlationId);
    if (!record) return;

    // Remove event correlations
    record.eventIds.forEach((eventId) => {
      this.eventCorrelations.delete(eventId);
    });

    this.correlations.delete(correlationId);
  }

  /**
   * Clear all correlations
   */
  clearAll(): void {
    this.correlations.clear();
    this.eventCorrelations.clear();
  }

  /**
   * Evict oldest correlations to make room for new ones
   */
  private evictOldest(): void {
    let oldestTime = Infinity;
    let oldestId: string | undefined;

    for (const [id, record] of this.correlations.entries()) {
      if (record.createdAt < oldestTime) {
        oldestTime = record.createdAt;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.clearCorrelation(oldestId);
    }
  }

  /**
   * Cleanup expired correlations
   * 
   * @param maxAge - Maximum age in milliseconds
   */
  cleanupExpired(maxAge: number = 3600000): void {
    const now = Date.now();

    for (const [id, record] of this.correlations.entries()) {
      if (now - record.lastActivity > maxAge) {
        this.clearCorrelation(id);
      }
    }
  }

  /**
   * Get correlation count
   * 
   * @returns Number of correlations
   */
  getCorrelationCount(): number {
    return this.correlations.size;
  }

  /**
   * Get event count for a correlation
   * 
   * @param correlationId - Correlation ID
   * @returns Number of events
   */
  getEventCount(correlationId: string): number {
    const record = this.correlations.get(correlationId);
    return record?.events.length ?? 0;
  }

  /**
   * Get event IDs for a correlation
   * 
   * @param correlationId - Correlation ID
   * @returns Set of event IDs
   */
  getEventIds(correlationId: string): Set<string> {
    const record = this.correlations.get(correlationId);
    return record?.eventIds ?? new Set();
  }
}

/**
 * Create correlation manager instance
 * 
 * @param options - Correlation manager options
 * @returns Correlation manager instance
 */
export function createCorrelationManager(
  options?: CorrelationManagerOptions
): CorrelationManager {
  return new CorrelationManager(options);
}
