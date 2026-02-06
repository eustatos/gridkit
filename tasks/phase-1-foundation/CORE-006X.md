# CORE-005X: Event Persistence & Time-Travel Debugging (Optional)

## Metadata

- **Task ID**: CORE-005X
- **Priority**: P3 (Optional Enhancement)
- **Estimated Time**: 3-4 hours
- **Status**: Optional
- **Dependencies**: CORE-005A, CORE-005B, CORE-005D
- **Use Case**: Advanced debugging, state replay, audit logging

## 🎯 Goal

Implement event persistence system with circular buffer storage, time-travel capabilities, and configurable retention policies for advanced debugging and audit trails.

## 📋 What TO Implement

### 1. Event History Storage

- Circular buffer implementation with configurable capacity (default: 1000 events)
- Efficient serialization of GridEvent objects
- Metadata storage (timestamps, source, event type statistics)
- Memory-optimized storage with object pooling for high-frequency events

### 2. Time-Travel API

- `getEvents(filter?: EventFilter): GridEvent[]` - Retrieve events with filtering
- `replayEvents(from: number, to: number, speed?: number): Promise<void>` - Event replay
- `jumpToEvent(eventId: string): void` - Jump to specific event in timeline
- `getEventSnapshot(time: number): EventSnapshot` - Get state at specific time

### 3. Event Filtering & Search

- Type-based filtering (`event.type.includes('row:')`)
- Payload-based filtering (partial match on payload fields)
- Time range filtering
- Source-based filtering (plugin, core, user)

### 4. Persistence Strategies

- In-memory only (default, for debugging sessions)
- IndexedDB persistence (optional, for crash recovery)
- Configurable retention policies (time-based, count-based, size-based)
- Export/Import functionality (JSON serialization)

### 5. Performance Optimizations

- Lazy serialization (serialize only when needed for export)
- Delta compression for similar consecutive events
- Background indexing for fast search
- Memory usage monitoring with automatic cleanup

## 🚫 What NOT to do

- ❌ NO real-time synchronization across multiple tabs
- ❌ NO encryption/security for persisted events
- ❌ NO complex query language (SQL-like)
- ❌ NO automatic event classification/machine learning
- ❌ NO UI components (handled by DevTools package)

## 📁 File Structure

```
packages/core/src/events/persistence/
├── storage/
│   ├── CircularBuffer.ts      # Efficient event storage
│   ├── EventSerializer.ts     # Event serialization/deserialization
│   └── RetentionPolicy.ts     # Memory management policies
├── time-travel/
│   ├── EventReplayer.ts       # Event replay engine
│   ├── TimelineManager.ts     # Timeline navigation
│   └── SnapshotManager.ts     # State snapshots
├── filtering/
│   ├── EventFilter.ts         # Filter predicates
│   ├── EventSearcher.ts       # Fast event search
│   └── EventIndex.ts         # Search indexes
└── EventHistory.ts           # Main API class
```

## 🧪 Test Requirements

- [ ] Storage: Events persist within capacity limits
- [ ] Circular buffer: Oldest events evicted correctly
- [ ] Replay: Events replay in correct order and timing
- [ ] Filtering: All filter types work correctly
- [ ] Performance: < 0.05ms per event for storage
- [ ] Memory: No leaks with continuous event recording
- [ ] Serialization: Events survive serialization round-trip
- [ ] Snapshot: State snapshots capture correct moment

## 💡 Implementation Pattern

```typescript
// CircularBuffer.ts - Memory-efficient storage
export class EventCircularBuffer<T> {
  private buffer: T[];
  private capacity: number;
  private head = 0;
  private tail = 0;
  private count = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(event: T): void {
    this.buffer[this.head] = event;
    this.head = (this.head + 1) % this.capacity;

    if (this.count === this.capacity) {
      this.tail = (this.tail + 1) % this.capacity;
    } else {
      this.count++;
    }
  }

  getEvents(filter?: (event: T) => boolean): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const idx = (this.tail + i) % this.capacity;
      const event = this.buffer[idx];
      if (!filter || filter(event)) {
        result.push(event);
      }
    }
    return result;
  }
}

// EventHistory.ts - Main API
export class EventHistory {
  private buffer: EventCircularBuffer<GridEvent>;
  private serializer = new EventSerializer();

  constructor(options: EventHistoryOptions = {}) {
    this.buffer = new EventCircularBuffer(options.capacity || 1000);
  }

  recordEvent(event: GridEvent): void {
    // Apply delta compression for high-frequency events
    const compressed = this.compressIfNeeded(event);
    this.buffer.push(compressed);

    // Update indexes for fast search
    this.updateIndexes(event);
  }

  async replayEvents(
    filter: EventFilter,
    options: ReplayOptions = {}
  ): Promise<void> {
    const events = this.buffer.getEvents(filter);
    const replayer = new EventReplayer(this.eventBus);

    await replayer.replay(events, {
      speed: options.speed || 1,
      onProgress: options.onProgress,
      onError: options.onError,
    });
  }
}
```

## 🔗 Integration Points

- **EventBus**: Subscribe to all events for recording
- **DevTools**: Provide history data for UI
- **Plugin System**: Allow plugins to record custom events
- **Performance Monitoring**: Track event volume and storage usage

## 📊 Success Criteria

- ✅ Store 1000 events with < 5MB memory usage
- ✅ Replay events with < 1ms timing accuracy
- ✅ Search 1000 events in < 10ms
- ✅ Zero performance impact when disabled
- ✅ Complete event serialization/deserialization
- ✅ Graceful handling of corrupted event data

## 🎯 Use Cases Supported

1. **Debugging**: Replay user actions to reproduce bugs
2. **Audit Trail**: Track all changes to data for compliance
3. **Crash Recovery**: Restore state after unexpected errors
4. **User Sessions**: Record user interactions for analytics
5. **Testing**: Replay specific event sequences in tests

## ⚙️ Configuration Options

```typescript
interface EventHistoryConfig {
  enabled: boolean;
  capacity: number; // Max events to store
  persistence: 'memory' | 'indexeddb' | 'none';
  retention: {
    maxAge: number; // milliseconds
    maxCount: number;
    maxSize: number; // bytes
  };
  compression: boolean; // Enable delta compression
  filters: string[]; // Event types to record
  excludeSensitive: boolean; // Don't record sensitive payloads
}
```

## 🔄 Prerequisites

This task requires the completion of CORE-005D (Middleware System & Event Pipeline) as it depends on the middleware system for event interception and recording. The event persistence system will use middleware to capture events before they are processed by the EventBus.