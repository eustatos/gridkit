# Performance Monitoring

Enterprise-grade performance monitoring for GridKit tables with real-time metrics, budget enforcement, and alerting.

## Features

- **Real-time Metrics**: Track operation performance with p50, p95, p99 percentiles
- **Budget Enforcement**: Set performance budgets and get automatic alerts when violated
- **Multiple Alert Destinations**: Console, Sentry, DataDog, New Relic support
- **Memory Leak Detection**: Detect and track memory leaks in your application
- **Zero Overhead**: No-op implementation when disabled for production
- **Comprehensive Reports**: Generate detailed performance reports in JSON or CSV

## Quick Start

```typescript
import { createTable } from '@gridkit/core'
import { 
  createSentryAlertDestination,
  createConsoleAlertDestination,
  INTERACTIVE_BUDGETS
} from '@gridkit/core/performance'

// Create table with performance monitoring enabled
const table = createTable({
  columns: [{ accessorKey: 'name' }],
  data: users,
  debug: {
    performance: true
  }
})

// Set performance budgets
table.metrics?.setBudgets(INTERACTIVE_BUDGETS)

// Add alert destinations
table.metrics?.addAlertDestination(createConsoleAlertDestination())
table.metrics?.addAlertDestination(
  createSentryAlertDestination({ dsn: process.env.SENTRY_DSN })
)

// Access metrics
const stats = table.metrics?.getOperationStats('rowModelBuild')
console.log(stats?.avgTime) // Average time in ms
```

## Performance Budgets

Pre-configured budget presets are available for different use cases:

```typescript
import { 
  createBudgetPreset,
  INTERACTIVE_BUDGETS,
  STRICT_BUDGETS,
  RELAXED_BUDGETS
} from '@gridkit/core/performance'

// Use preset budgets
table.metrics?.setBudgets(createBudgetPreset('strict'))
table.metrics?.setBudgets(createBudgetPreset('normal'))
table.metrics?.setBudgets(createBudgetPreset('relaxed'))

// Or use predefined budgets
table.metrics?.setBudgets(INTERACTIVE_BUDGETS)
```

## Alert Destinations

### Console

```typescript
import { createConsoleAlertDestination } from '@gridkit/core/performance'

table.metrics?.addAlertDestination(createConsoleAlertDestination())
```

### Sentry

```typescript
import { createSentryAlertDestination } from '@gridkit/core/performance'

table.metrics?.addAlertDestination(
  createSentryAlertDestination({ 
    dsn: 'https://example@sentry.io/123' 
  })
)
```

### DataDog

```typescript
import { createDataDogAlertDestination } from '@gridkit/core/performance'

table.metrics?.addAlertDestination(
  createDataDogAlertDestination({ 
    apiKey: process.env.DATADOG_API_KEY 
  })
)
```

### New Relic

```typescript
import { createNewRelicAlertDestination } from '@gridkit/core/performance'

table.metrics?.addAlertDestination(
  createNewRelicAlertDestination({ 
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY 
  })
)
```

## API Reference

### EnhancedPerformanceMonitor

```typescript
class EnhancedPerformanceMonitor {
  // Track operations
  trackOperation(operation: string, durationMs: number): void
  
  // Get statistics
  getOperationStats(operation: string): OperationMetrics | undefined
  getAllStats(): OperationMetrics[]
  
  // Budget management
  setBudget(budget: PerformanceBudget): void
  getBudget(operation: string): PerformanceBudget | undefined
  checkBudget(operation: string, durationMs: number): BudgetViolation | null
  
  // Memory tracking
  trackMemoryUsage(): void
  getMemoryMetrics(): MemoryMetrics
  detectMemoryLeaks(): MemoryLeak[]
  
  // Alert destinations
  addAlertDestination(destination: AlertDestination): void
  removeAlertDestination(id: string): void
  
  // Reports
  generateReport(options?: ReportOptions): PerformanceReport
  exportMetrics(format: 'json' | 'csv' = 'json'): string
}
```

### OperationMetrics

```typescript
interface OperationMetrics {
  operation: string
  count: number
  avgTime: number
  minTime: number
  maxTime: number
  totalTime: number
  p50: number
  p95: number
  p99: number
  lastExecuted: number
  errors?: number
}
```

### BudgetViolation

```typescript
interface BudgetViolation {
  operation: string
  actual: number
  budget: number
  severity: 'warning' | 'error' | 'critical'
  timestamp: number
  impact: 'userVisible' | 'background'
  percentageOver: number
}
```

## Configuration

### Enable/Disable

```typescript
const table = createTable({
  columns: [{ accessorKey: 'name' }],
  data: users,
  debug: {
    performance: true // Set to false for production
  }
})
```

### Custom Budgets

```typescript
import { createCustomBudgets } from '@gridkit/core/performance'

table.metrics?.setBudgets(
  createCustomBudgets({
    rowModelBuild: 16,
    sorting: 50,
    filtering: 100,
  }, {
    severity: 'error',
    enabled: true
  })
)
```

## Performance Requirements

- Metrics tracking overhead: < 0.1ms per operation
- Budget check: < 0.05ms
- Alert send: < 5ms (async)
- Report generation: < 50ms for 1000 operations

## Best Practices

1. **Enable in Development**: Keep performance monitoring enabled during development
2. **Set Strict Budgets**: Use strict budgets to catch performance regressions early
3. **Monitor User-Visible Operations**: Focus on rowModelBuild, sorting, filtering
4. **Use Appropriate Alert Destinations**: Console for development, Sentry/DataDog for production
5. **Regular Reports**: Generate performance reports regularly to identify trends

## Troubleshooting

### High Overhead

If you see performance overhead:

1. Disable monitoring in production: `debug: { performance: false }`
2. Reduce sample rate for high-frequency operations
3. Clear metrics periodically: `table.metrics?.clear()`

### Missing Metrics

If metrics aren't being tracked:

1. Verify performance monitoring is enabled
2. Check operation names match expected patterns
3. Ensure budgets are properly configured

### Alert Not Sending

If alerts aren't being sent:

1. Verify alert destination is properly configured
2. Check console for errors
3. Ensure notification service credentials are valid

## Examples

See the performance monitoring examples in:

- `packages/core/src/performance/examples/`
- `packages/tanstack-adapter/examples/`

## Contributing

Contributions are welcome! Please read the [Contributing Guide](../../../CONTRIBUTING.md) for details.

## License

MIT License - see the [LICENSE](../../../LICENSE) file for details.
