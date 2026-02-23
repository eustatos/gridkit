/**
 * Enhanced Performance Monitor Examples.
 *
 * Practical examples showing how to use the enhanced performance monitoring system.
 *
 * @module @gridkit/core/performance/examples
 */

import { EnhancedPerformanceMonitor } from '../monitor/EnhancedPerformanceMonitor'
import {
  createConsoleAlertDestination,
  createSentryAlertDestination,
  createDataDogAlertDestination,
} from '../alerts'
import { createBudgetPreset, INTERACTIVE_BUDGETS } from '../budgets/presets'

// ===================================================================
// Example 1: Basic Performance Tracking
// ===================================================================

function exampleBasicTracking() {
  // Create monitor with performance tracking enabled
  const monitor = new EnhancedPerformanceMonitor(true)

  // Track an operation
  const start = performance.now()
  // Simulate some work
  const data = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: i * 2 }))
  const duration = performance.now() - start

  monitor.trackOperation('dataProcessing', duration)

  // Get statistics
  const stats = monitor.getOperationStats('dataProcessing')
  console.log('Average time:', stats?.avgTime.toFixed(2), 'ms')

  // Track multiple operations
  for (let i = 0; i < 5; i++) {
    const operationStart = performance.now()
    // Simulate work
    const _ = Array.from({ length: 100 }, (_, j) => j * i)
    const operationDuration = performance.now() - operationStart

    monitor.trackOperation('batchProcessing', operationDuration)
  }

  console.log('All stats:', monitor.getAllStats())
}

// ===================================================================
// Example 2: Budget Management
// ===================================================================

function exampleBudgetManagement() {
  const monitor = new EnhancedPerformanceMonitor(true)

  // Set a budget for row model build (16ms for 60fps)
  monitor.setBudget({
    operation: 'rowModelBuild',
    budgetMs: 16,
    enabled: true,
    severity: 'error',
  })

  // Simulate operation
  const start = performance.now()
  // Simulate expensive operation
  const _ = Array.from({ length: 5000 }, (_, i) => i)
  const duration = performance.now() - start

  // Check if budget is violated
  const violation = monitor.checkBudget('rowModelBuild', duration)

  if (violation) {
    console.error('Budget violated!', violation)
  } else {
    console.log('Budget OK:', duration.toFixed(2), 'ms')
  }

  // Get all current violations
  const violations = monitor.checkBudgets()
  console.log('All violations:', violations)
}

// ===================================================================
// Example 3: Alert Destinations
// ===================================================================

function exampleAlertDestinations() {
  const monitor = new EnhancedPerformanceMonitor(true)

  // Set a budget
  monitor.setBudget({
    operation: 'expensiveOperation',
    budgetMs: 10,
    enabled: true,
    severity: 'error',
  })

  // Add console destination
  const consoleDestination = createConsoleAlertDestination()
  monitor.addAlertDestination(consoleDestination)

  // Add Sentry destination (example)
  const sentryDestination = createSentryAlertDestination({
    dsn: 'https://example@sentry.io/123',
    environment: 'development',
  })
  monitor.addAlertDestination(sentryDestination)

  // Add DataDog destination (example)
  const dataDogDestination = createDataDogAlertDestination({
    apiKey: process.env.DATADOG_API_KEY,
  })
  monitor.addAlertDestination(dataDogDestination)

  // Simulate budget violation
  monitor.checkBudget('expensiveOperation', 25)

  // Remove an alert destination
  monitor.removeAlertDestination('console')
}

// ===================================================================
// Example 4: Budget Presets
// ===================================================================

function exampleBudgetPresets() {
  const monitor = new EnhancedPerformanceMonitor(true)

  // Use preset budgets
  const strictBudgets = createBudgetPreset('strict')
  const normalBudgets = createBudgetPreset('normal')
  const relaxedBudgets = createBudgetPreset('relaxed')

  // Set budgets from preset
  strictBudgets.forEach((budget) => {
    monitor.setBudget(budget)
  })

  // Or use predefined interactive budgets
  const interactiveBudgets = Object.entries(INTERACTIVE_BUDGETS).map(
    ([operation, budgetMs]) => ({
      operation,
      budgetMs,
      enabled: true,
      severity: 'error' as const,
    })
  )

  interactiveBudgets.forEach((budget) => {
    monitor.setBudget(budget)
  })
}

// ===================================================================
// Example 5: Memory Tracking
// ===================================================================

function exampleMemoryTracking() {
  const monitor = new EnhancedPerformanceMonitor(true)

  // Track memory usage
  monitor.trackMemoryUsage()
  const memoryMetrics = monitor.getMemoryMetrics()
  console.log('Memory metrics:', memoryMetrics)

  // Simulate memory leak detection
  for (let i = 0; i < 30; i++) {
    monitor.trackMemoryOperation('dataCache', 1024)
  }

  const leaks = monitor.detectMemoryLeaks()
  console.log('Detected leaks:', leaks)
}

// ===================================================================
// Example 6: Performance Reports
// ===================================================================

function examplePerformanceReports() {
  const monitor = new EnhancedPerformanceMonitor(true)

  // Add some operations
  for (let i = 0; i < 10; i++) {
    monitor.trackOperation('op1', Math.random() * 20)
    monitor.trackOperation('op2', Math.random() * 30)
  }

  // Set budgets to trigger some violations
  monitor.setBudget({
    operation: 'op1',
    budgetMs: 10,
    enabled: true,
    severity: 'error',
  })

  // Generate a report
  const report = monitor.generateReport({
    detailed: true,
    memory: true,
    budgets: true,
  })

  console.log('Performance Report:')
  console.log('Timestamp:', report.timestamp)
  console.log('Summary:', report.summary)
  console.log('Operations:', Object.keys(report.operations).length)
  console.log('Recommendations:', report.recommendations)

  // Export to JSON
  const jsonReport = monitor.exportMetrics('json')
  console.log('JSON Report:', jsonReport)

  // Export to CSV
  const csvReport = monitor.exportMetrics('csv')
  console.log('CSV Report:', csvReport)
}

// ===================================================================
// Example 7: Full Integration Example
// ===================================================================

function exampleFullIntegration() {
  // Create a performance monitor
  const monitor = new EnhancedPerformanceMonitor(true)

  // Configure budgets
  const budgets = createBudgetPreset('normal')
  budgets.forEach((budget) => {
    monitor.setBudget(budget)
  })

  // Add alert destinations
  monitor.addAlertDestination(createConsoleAlertDestination())
  if (process.env.SENTRY_DSN) {
    monitor.addAlertDestination(createSentryAlertDestination({
      dsn: process.env.SENTRY_DSN,
    }))
  }

  // Simulate table operations
  const operations = ['rowModelBuild', 'sorting', 'filtering', 'pagination']

  operations.forEach((op) => {
    const start = performance.now()
    // Simulate operation
    const _ = Array.from({ length: 1000 }, (_, i) => i)
    const duration = performance.now() - start

    monitor.trackOperation(op, duration)

    // Check budget
    const violation = monitor.checkBudget(op, duration)
    if (violation) {
      console.error(`Budget violated for ${op}:`, violation.actual, 'ms >', violation.budget, 'ms')
    }
  })

  // Get memory metrics
  monitor.trackMemoryUsage()
  console.log('Memory:', monitor.getMemoryMetrics())

  // Generate report
  const report = monitor.generateReport()
  console.log('Report generated at:', new Date(report.timestamp).toISOString())

  // Cleanup
  monitor.clear()
}

// Run examples
if (typeof require !== 'undefined' && require.main === module) {
  console.log('Running performance monitor examples...\n')

  console.log('=== Example 1: Basic Tracking ===')
  exampleBasicTracking()

  console.log('\n=== Example 2: Budget Management ===')
  exampleBudgetManagement()

  console.log('\n=== Example 3: Alert Destinations ===')
  exampleAlertDestinations()

  console.log('\n=== Example 4: Budget Presets ===')
  exampleBudgetPresets()

  console.log('\n=== Example 5: Memory Tracking ===')
  exampleMemoryTracking()

  console.log('\n=== Example 6: Performance Reports ===')
  examplePerformanceReports()

  console.log('\n=== Example 7: Full Integration ===')
  exampleFullIntegration()

  console.log('\nAll examples completed!')
}

export {
  exampleBasicTracking,
  exampleBudgetManagement,
  exampleAlertDestinations,
  exampleBudgetPresets,
  exampleMemoryTracking,
  examplePerformanceReports,
  exampleFullIntegration,
}
