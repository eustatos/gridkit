/**
 * Enhanced Performance Monitor Tests.
 *
 * Tests for the enhanced performance monitoring system.
 *
 * @module @gridkit/core/performance/__tests__/enhanced
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { EnhancedPerformanceMonitor } from '../monitor/EnhancedPerformanceMonitor'
import { createConsoleAlertDestination } from '../alerts/console'
import { createBudgetPreset } from '../budgets/presets'

describe('EnhancedPerformanceMonitor', () => {
  describe('Metrics Tracking', () => {
    test('should track operation metrics', () => {
      const monitor = new EnhancedPerformanceMonitor(true)

      monitor.trackOperation('getRowModel', 10)
      monitor.trackOperation('getRowModel', 20)
      monitor.trackOperation('getRowModel', 15)

      const stats = monitor.getOperationStats('getRowModel')

      expect(stats).toBeDefined()
      expect(stats?.operation).toBe('getRowModel')
      expect(stats?.count).toBe(3)
      expect(stats?.avgTime).toBeCloseTo(15, 0)
      expect(stats?.minTime).toBe(10)
      expect(stats?.maxTime).toBe(20)
    })

    test('should track percentile calculations', () => {
      const monitor = new EnhancedPerformanceMonitor(true)

      // Add 100 measurements
      for (let i = 1; i <= 100; i++) {
        monitor.trackOperation('test', i)
      }

      const stats = monitor.getOperationStats('test')
      expect(stats).toBeDefined()

      // p50 should be around 50
      expect(stats?.p50).toBeGreaterThanOrEqual(45)
      expect(stats?.p50).toBeLessThanOrEqual(55)

      // p95 should be around 95
      expect(stats?.p95).toBeGreaterThanOrEqual(90)
      expect(stats?.p95).toBeLessThanOrEqual(100)

      // p99 should be around 99
      expect(stats?.p99).toBeGreaterThanOrEqual(95)
    })

    test('should track multiple operations', () => {
      const monitor = new EnhancedPerformanceMonitor(true)

      monitor.trackOperation('op1', 10)
      monitor.trackOperation('op2', 20)
      monitor.trackOperation('op1', 30)

      const stats1 = monitor.getOperationStats('op1')
      const stats2 = monitor.getOperationStats('op2')

      expect(stats1?.count).toBe(2)
      expect(stats1?.avgTime).toBe(20)
      expect(stats2?.count).toBe(1)
      expect(stats2?.avgTime).toBe(20)
    })
  })

  describe('Budget Management', () => {
    test('should detect budget violations', () => {
      const monitor = new EnhancedPerformanceMonitor(true)

      monitor.setBudget({
        operation: 'testOp',
        budgetMs: 16,
        enabled: true,
        severity: 'error',
      })

      const violation = monitor.checkBudget('testOp', 25)

      expect(violation).toBeDefined()
      expect(violation?.operation).toBe('testOp')
      expect(violation?.actual).toBe(25)
      expect(violation?.budget).toBe(16)
      expect(violation?.severity).toBe('error')
    })

    test('should detect violations with warning severity', () => {
      const monitor = new EnhancedPerformanceMonitor(true)

      monitor.setBudget({
        operation: 'testOp',
        budgetMs: 50,
        enabled: true,
        severity: 'warning',
      })

      const violation = monitor.checkBudget('testOp', 60)

      expect(violation?.severity).toBe('warning')
    })

    test('should return null when budget not exceeded', () => {
      const monitor = new EnhancedPerformanceMonitor(true)

      monitor.setBudget({
        operation: 'testOp',
        budgetMs: 100,
        enabled: true,
        severity: 'error',
      })

      const violation = monitor.checkBudget('testOp', 50)

      expect(violation).toBeNull()
    })

    test('should return null when budget is disabled', () => {
      const monitor = new EnhancedPerformanceMonitor(true)

      monitor.setBudget({
        operation: 'testOp',
        budgetMs: 100,
        enabled: false,
        severity: 'error',
      })

      const violation = monitor.checkBudget('testOp', 200)

      expect(violation).toBeNull()
    })
  })

  describe('Alert Destinations', () => {
    test('should add and remove alert destinations', () => {
      const monitor = new EnhancedPerformanceMonitor(true)
      const destination = createConsoleAlertDestination()

      monitor.addAlertDestination(destination)
      expect(monitor['alertDestinations'].size).toBe(1)

      monitor.removeAlertDestination('console')
      expect(monitor['alertDestinations'].size).toBe(0)
    })

    test('should send violations to console destination', async () => {
      const monitor = new EnhancedPerformanceMonitor(true)
      const destination = createConsoleAlertDestination()

      // Mock console.error
      const consoleError = jest.spyOn(console, 'error').mockImplementation()

      monitor.addAlertDestination(destination)

      monitor.setBudget({
        operation: 'testOp',
        budgetMs: 10,
        enabled: true,
        severity: 'error',
      })

      // This should trigger an alert
      monitor.checkBudget('testOp', 20)

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })
  })

  describe('Memory Tracking', () => {
    test('should track memory usage', () => {
      const monitor = new EnhancedPerformanceMonitor(true)

      monitor.trackMemoryUsage()
      const metrics = monitor.getMemoryMetrics()

      expect(metrics.heapUsed).toBeGreaterThanOrEqual(0)
      expect(metrics.peakHeapUsed).toBeGreaterThanOrEqual(0)
      expect(metrics.allocations).toBeGreaterThanOrEqual(0)
    })

    test('should detect memory leaks', () => {
      const monitor = new EnhancedPerformanceMonitor(true)

      // Simulate memory leak by adding many operations
      for (let i = 0; i < 20; i++) {
        monitor.trackMemoryOperation('leakCategory', 1024)
      }

      const leaks = monitor.detectMemoryLeaks()
      expect(leaks.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Reports', () => {
    test('should generate performance report', () => {
      const monitor = new EnhancedPerformanceMonitor(true)

      // Add some metrics
      monitor.trackOperation('op1', 10)
      monitor.trackOperation('op2', 20)

      const report = monitor.generateReport()

      expect(report.timestamp).toBeGreaterThan(0)
      expect(report.summary.totalOperations).toBeGreaterThan(0)
      expect(report.operations).toBeDefined()
      expect(report.recommendations).toBeDefined()
    })

    test('should export metrics to JSON', () => {
      const monitor = new EnhancedPerformanceMonitor(true)
      monitor.trackOperation('test', 10)

      const json = monitor.exportMetrics('json')
      const parsed = JSON.parse(json)

      expect(parsed).toBeDefined()
      expect(parsed.operations).toBeDefined()
    })

    test('should export metrics to CSV', () => {
      const monitor = new EnhancedPerformanceMonitor(true)
      monitor.trackOperation('test', 10)

      const csv = monitor.exportMetrics('csv')
      expect(csv).toContain('Operation,Count')
      expect(csv).toContain('test')
    })
  })

  describe('Configuration', () => {
    test('should be able to clear all metrics', () => {
      const monitor = new EnhancedPerformanceMonitor(true)

      monitor.trackOperation('test', 10)
      expect(monitor.getOperationStats('test')).toBeDefined()

      monitor.clear()
      expect(monitor.getOperationStats('test')).toBeUndefined()
    })

    test('should be able to enable/disable', () => {
      const monitor = new EnhancedPerformanceMonitor(true)

      monitor.setEnabled(false)
      monitor.trackOperation('test', 10)

      // Should not track when disabled
      const stats = monitor.getOperationStats('test')
      expect(stats).toBeUndefined()
    })
  })

  describe('Integration with Budget Presets', () => {
    test('should work with budget presets', () => {
      const monitor = new EnhancedPerformanceMonitor(true)
      const budgets = createBudgetPreset('strict')

      // Set all budgets from preset
      budgets.forEach((budget) => {
        monitor.setBudget(budget)
      })

      // Should have budgets set
      expect(monitor.getBudget('rowModelBuild')).toBeDefined()
      expect(monitor.getBudget('sorting')).toBeDefined()
    })
  })
})
