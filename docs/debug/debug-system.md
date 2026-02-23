# Advanced Debugging Tools Documentation

GridKit's advanced debugging system provides powerful tools for development and debugging.

## Features

- **Event Logging**: Track all table events with filtering and history
- **Time Travel**: Navigate through table states with snapshots
- **Performance Profiling**: Profile operations and identify bottlenecks
- **Memory Management**: Detect memory leaks and track object lifecycles
- **Event Replay**: Replay events for debugging purposes

## Quick Start

\`\`\`typescript
import { createTable } from '@gridkit/core';

const table = createTable({
  data: yourData,
  columns: yourColumns,
  debug: {
    events: true,
    performance: true,
    memory: true,
    timeTravel: true,
  },
});

const debug = table.debug!;
debug.logEvent({ type: 'custom:event', payload: {}, timestamp: Date.now() });
\`\`\`

## DebugManager API

### Event Debugging
- \`logEvent(event)\` - Log an event to history
- \`getEventHistory(filter?)\` - Get logged events with optional filter
- \`clearEventHistory()\` - Clear event history

### Time Travel
- \`createSnapshot(state?, timestamp?)\` - Create a snapshot of current state
- \`restoreSnapshot(timestamp)\` - Restore to a specific snapshot
- \`listSnapshots()\` - List all available snapshots
- \`travelBack(steps)\` - Travel back N snapshots
- \`travelForward(steps)\` - Travel forward N snapshots

### Performance Profiling
- \`profile(fn)\` - Profile a function
- \`profileWithLabel(label, fn)\` - Profile with custom label
- \`startProfiling(label)\` - Start profiling (manual)
- \`stopProfiling(label)\` - Stop profiling (manual)
- \`getBottlenecks(threshold)\` - Get operations above threshold

### Memory Debugging
- \`trackMemory()\` - Create memory snapshot
- \`detectLeaks()\` - Detect potential memory leaks
- \`createHeapSnapshot()\` - Create heap snapshot
- \`analyzeMemoryGrowth()\` - Analyze memory growth over time

### Debug Info
- \`getDebugInfo()\` - Get complete debug information
- \`exportDebugData(format)\` - Export debug data (JSON or ZIP)
- \`clear()\` - Clear all debug data

## Examples

### Time Travel Debugging

\`\`\`typescript
const table = createTable({
  data: initialData,
  columns,
  debug: { timeTravel: true },
});

const snapshot1 = table.debug!.createSnapshot();
table.setSorting([{ id: 'name', desc: true }]);
const snapshot2 = table.debug!.createSnapshot();

table.debug!.restoreSnapshot(snapshot1.timestamp);
\`\`\`

### Performance Profiling

\`\`\`typescript
const table = createTable({
  data: largeDataset,
  columns,
  debug: { performance: true },
});

const result = table.debug!.profileWithLabel('loadData', () => {
  table.setData(largeDataset);
});

console.log('Load time:', result.duration, 'ms');
\`\`\`

### Memory Leak Detection

\`\`\`typescript
const table = createTable({
  data: [],
  columns,
  debug: { memory: true },
});

const leaks = table.debug!.detectLeaks();
console.log('Leaks:', leaks);
\`\`\`

## Best Practices

1. **Use in Development Only** - Enable debug features in development and disable in production
2. **Limit Event History** - Set \`maxHistory\` to prevent memory issues
3. **Monitor Memory** - Regularly check for memory leaks during development
4. **Profile Critical Paths** - Profile operations that feel slow
5. **Snapshot Strategically** - Create snapshots at meaningful points for time travel
6. **Export for Analysis** - Use \`exportDebugData()\` to share debug info with team