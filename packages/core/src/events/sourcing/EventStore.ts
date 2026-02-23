/**
 * Event Sourcing System
 * 
 * Event sourcing implementation with snapshot support for GridKit's
 * enterprise event system.
 * 
 * @module @gridkit/core/events/sourcing
 */

import type { EnhancedTableEvent, EnhancedGridEvent, EnhancedTableSnapshot, EnhancedEventStoreOptions } from '@/events/types/enhanced';

/**
 * Event store options with defaults
 */
interface ResolvedEnhancedEventStoreOptions {
  maxEvents: number;
  enableSnapshots: boolean;
  snapshotInterval: number;
}

/**
 * Internal event storage
 */
interface StoredEvent {
  event: EnhancedTableEvent | EnhancedGridEvent;
  index: number;
  timestamp: number;
}

/**
 * Internal snapshot storage
 */
interface StoredSnapshot {
  snapshot: EnhancedTableSnapshot;
  eventIndex: number;
}

/**
 * Event Store for event sourcing
 * 
 * Stores events and provides time-travel debugging capabilities
 * through snapshots and replay functionality.
 */
export class EventStore {
  private events: StoredEvent[] = [];
  private snapshots: StoredSnapshot[] = [];
  private options: ResolvedEnhancedEventStoreOptions;
  private nextEventIndex = 0;
  private eventListeners = new Map<string, Set<(event: EnhancedTableEvent | EnhancedGridEvent) => void>>();

  constructor(options: EnhancedEventStoreOptions = {}) {
    this.options = {
      maxEvents: options.maxEvents ?? 10000,
      enableSnapshots: options.enableSnapshots ?? true,
      snapshotInterval: options.snapshotInterval ?? 100,
    };
  }

  /**
   * Append an event to the store
   * 
   * @param event - Event to append
   * @returns Event index
   */
  append(event: EnhancedTableEvent | EnhancedGridEvent): number {
    const index = this.nextEventIndex++;
    const storedEvent: StoredEvent = {
      event,
      index,
      timestamp: Date.now(),
    };

    this.events.push(storedEvent);

    // Enforce max events limit
    if (this.events.length > this.options.maxEvents) {
      this.events.shift();
    }

    // Emit event to listeners
    this.emit(event.type, event);

    // Create snapshot at intervals
    if (this.options.enableSnapshots && this.nextEventIndex % this.options.snapshotInterval === 0) {
      this.createSnapshot();
    }

    return index;
  }

  /**
   * Get events within a range
   * 
   * @param from - Start index (inclusive)
   * @param to - End index (exclusive)
   * @returns Array of events
   */
  getEvents(from?: number, to?: number): (EnhancedTableEvent | EnhancedGridEvent)[] {
    let start = from ?? 0;
    let end = to ?? this.events.length;

    // Handle negative indices
    if (start < 0) start = Math.max(0, this.events.length + start);
    if (end < 0) end = Math.max(0, this.events.length + end);

    return this.events.slice(start, end).map((e) => e.event);
  }

  /**
   * Get all events
   * 
   * @returns Array of all events
   */
  getAllEvents(): (EnhancedTableEvent | EnhancedGridEvent)[] {
    return this.events.map((e) => e.event);
  }

  /**
   * Get event count
   * 
   * @returns Number of events
   */
  getCount(): number {
    return this.events.length;
  }

  /**
   * Get last event
   * 
   * @returns Last event or undefined
   */
  getLastEvent(): EnhancedTableEvent | EnhancedGridEvent | undefined {
    return this.events[this.events.length - 1]?.event;
  }

  /**
   * Get event at specific index
   * 
   * @param index - Event index
   * @returns Event or undefined
   */
  getEvent(index: number): EnhancedTableEvent | EnhancedGridEvent | undefined {
    if (index < 0 || index >= this.events.length) {
      return undefined;
    }
    return this.events[index].event;
  }

  /**
   * Create a snapshot of current state
   * 
   * @param state - Current table state
   * @returns Snapshot
   */
  createSnapshot(state?: Record<string, unknown>): EnhancedTableSnapshot | undefined {
    if (!this.options.enableSnapshots) {
      return undefined;
    }

    const snapshot: EnhancedTableSnapshot = {
      timestamp: Date.now(),
      eventIndex: this.nextEventIndex,
      state: state ?? {},
      metadata: {
        rowCount: 0,  // Will be updated by integration
        columnCount: 0,
        memory: 0,
        eventId: (this.events[this.events.length - 1]?.event as any).eventId || '',
      },
    };

    this.snapshots.push({
      snapshot,
      eventIndex: this.nextEventIndex,
    });

    // Keep only recent snapshots
    if (this.snapshots.length > 10) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * Get snapshots
   * 
   * @returns Array of snapshots
   */
  getSnapshots(): EnhancedTableSnapshot[] {
    return this.snapshots.map((s) => s.snapshot);
  }

  /**
   * Get snapshot at or before event index
   * 
   * @param eventIndex - Event index
   * @returns Snapshot or undefined
   */
  getSnapshot(eventIndex: number): EnhancedTableSnapshot | undefined {
    // Find the latest snapshot before or at the event index
    for (let i = this.snapshots.length - 1; i >= 0; i--) {
      if (this.snapshots[i].eventIndex <= eventIndex) {
        return this.snapshots[i].snapshot;
      }
    }
    return undefined;
  }

  /**
   * Replay events from a starting point
   * 
   * @param from - Start index (inclusive)
   * @param to - End index (exclusive)
   * @returns Array of events for replay
   */
  replay(from?: number, to?: number): (EnhancedTableEvent | EnhancedGridEvent)[] {
    return this.getEvents(from, to);
  }

  /**
   * Subscribe to events
   * 
   * @param eventType - Event type to subscribe to
   * @param handler - Event handler
   * @returns Unsubscribe function
   */
  on(eventType: string, handler: (event: EnhancedTableEvent | EnhancedGridEvent) => void): () => void {
    let listeners = this.eventListeners.get(eventType);
    if (!listeners) {
      listeners = new Set();
      this.eventListeners.set(eventType, listeners);
    }
    listeners.add(handler);

    return () => {
      listeners?.delete(handler);
      if (listeners?.size === 0) {
        this.eventListeners.delete(eventType);
      }
    };
  }

  /**
   * Clear all events and snapshots
   */
  clear(): void {
    this.events = [];
    this.snapshots = [];
    this.nextEventIndex = 0;
    this.eventListeners.clear();
  }

  /**
   * Destroy the event store
   */
  destroy(): void {
    this.clear();
  }

  /**
   * Emit event to listeners
   */
  private emit(eventType: string, event: EnhancedTableEvent | EnhancedGridEvent): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach((handler) => {
        try {
          handler(event);
        } catch {
          // Ignore listener errors
        }
      });
    }
  }
}

/**
 * Create event store instance
 * 
 * @param options - Enhanced event store options
 * @returns Event store instance
 */
export function createEventStore(options?: EnhancedEventStoreOptions): EventStore {
  return new EventStore(options);
}
