# Performance Monitoring - Quick Start Guide

## Enable Monitoring

Add `debug: { performance: true }` to your table configuration:

```typescript
import { createTable } from '@gridkit/core';

const table = createTable({
  columns: [{ accessorKey: 'name' }],
  data: myData,
  debug: {
    performance: true,  // Enable performance monitoring
  },
});

// Access metrics
console.log(table.metrics);
```

## View Metrics

```typescript
// Get all metrics
const metrics = table.metrics;

// Get operation statistics
const stateUpdateStats = metrics.getOperationStats('stateUpdate');
console.log(stateUpdateStats.avgTime);  // Average time in ms

// Check for budget violations
const violations = metrics.checkBudgets();
violations.forEach(v => {
  console.log(`${v.operation}: ${v.severity} - ${v.percentage * 100}% of budget`);
});
```

## Custom Budgets

```typescript
const table = createTable({
  columns: [{ accessorKey: 'name' }],
  data: myData,
  performanceBudgets: {
    renderCycle: 16,        // 60fps (16ms)
    stateUpdate: 5,         // 5ms max
    rowModelBuild: 10,      // 10ms max
    
    memory: {
      baseOverhead: 5 * 1024 * 1024,  // 5MB
      perRow: 1024,                    // 1KB per row
    },
  },
});
```

## Monitor Custom Operations

```typescript
import { createPerformanceMonitor } from '@gridkit/core';

const monitor = createPerformanceMonitor({ enabled: true });

// Monitor an operation
const stop = monitor.start('myOperation');
try {
  // ... your code ...
} finally {
  stop();
}

// Monitor memory
const result = monitor.measureMemory(() => {
  return expensiveOperation();
});

// Monitor async operations
await monitor.trackAsync(asyncOperation(), 'asyncOp');
```

## Subscribe to Events

```typescript
const monitor = createPerformanceMonitor({ enabled: true });

// Subscribe to budget violations
const unsubscribe = monitor.on('budgetViolation', (violation) => {
  console.log('Budget violated:', violation);
});

// Subscribe to metric updates
monitor.on('metricUpdate', (metrics) => {
  console.log('Metrics updated:', metrics);
});
```

## Check for Memory Leaks

```typescript
const monitor = createPerformanceMonitor({
  enabled: true,
  detectMemoryLeaks: true,
});

// Track objects
const obj = { data: '...' };
monitor.track(obj, 'myCategory');

// Check for leaks
const leaks = monitor.checkLeaks();
if (leaks.length > 0) {
  console.log('Potential memory leaks detected:', leaks);
}
```

## Common Operations

### Get Report

```typescript
const report = {
  operations: metrics.operations,
  memory: metrics.memory,
  timings: metrics.timings,
  violations: metrics.violations,
  budgets: metrics.budgets,
};
```

### Clear Metrics

```typescript
monitor.clear();  // Clear all collected metrics
```

### Disable/Enable

```typescript
monitor.setEnabled(false);  // Disable monitoring
monitor.setEnabled(true);   // Re-enable
```

## Performance Overhead

- **Disabled**: < 0.001ms per operation (no measurable overhead)
- **Enabled**: ±1% timing accuracy, ±2% memory accuracy

## Best Practices

1. **Enable only in development**: Use `debug: { performance: true }` only during development and testing
2. **Set realistic budgets**: Base budgets on your application's performance requirements
3. **Monitor critical paths**: Focus on state updates, rendering, and data processing
4. **Check for leaks**: Enable memory leak detection for long-running applications
5. **Set up alerts**: Subscribe to budget violations for early detection

## Troubleshooting

### High Memory Usage
- Check for memory leaks with `monitor.checkLeaks()`
- Review memory budgets and adjust if needed
- Ensure objects are being garbage collected

### Slow State Updates
- Profile state update operations
- Consider debouncing or batching updates
- Check for unnecessary re-renders

### Budget Violations
- Increase budget thresholds
- Optimize the operation causing violations
- Consider lazy loading or pagination for large datasets
