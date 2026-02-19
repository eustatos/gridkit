/**
 * Performance Monitor Tests.
 *
 * Tests for the zero-overhead performance monitoring system.
 *
 * @module @gridkit/core/performance/__tests__
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { createPerformanceMonitor, isMonitorEnabled } from '../monitor/factory';
import { createTable } from '../../table';
import { DEFAULT_BUDGETS } from '../types';

describe('Performance Monitor', () => {
  describe('No-overhead when disabled', () => {
    test('Returns immediately with no measurement', () => {
      const monitor = createPerformanceMonitor({ enabled: false });

      // Should return immediately with no measurement
      const start = performance.now();
      const stop = monitor.start('test');
      stop();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(0.1); // < 0.1ms overhead
    });

    test('No-op methods have zero overhead', () => {
      const monitor = createPerformanceMonitor({ enabled: false });

      // All methods should return immediately
      const metrics = monitor.getMetrics();
      expect(metrics.operations).toEqual({});
      expect(metrics.violations).toEqual([]);
    });

    test('Memory operations have zero overhead', () => {
      const monitor = createPerformanceMonitor({ enabled: false });

      const result = monitor.measureMemory(() => 42);
      expect(result).toBe(42);
    });

    test('Async tracking has zero overhead', () => {
      const monitor = createPerformanceMonitor({ enabled: false });

      const promise = Promise.resolve(42);
      const result = monitor.trackAsync(promise, 'test');
      expect(result).toBe(promise);
    });
  });

  describe('Accurate measurement when enabled', () => {
    let monitor: any;

    beforeEach(() => {
      monitor = createPerformanceMonitor({ enabled: true });
    });

    test('Measures operations accurately', async () => {
      const stop = monitor.start('testOperation');

      // Wait for 10ms
      await new Promise((resolve) => setTimeout(resolve, 10));

      stop();

      const stats = monitor.getOperationStats('testOperation');
      expect(stats.count).toBe(1);
      expect(stats.avgTime).toBeGreaterThan(9);
      expect(stats.avgTime).toBeLessThan(20);
    });

    test('Measures multiple operations', async () => {
      // First operation: 10ms
      const stop1 = monitor.start('operation1');
      await new Promise((resolve) => setTimeout(resolve, 10));
      stop1();

      // Second operation: 20ms
      const stop2 = monitor.start('operation2');
      await new Promise((resolve) => setTimeout(resolve, 20));
      stop2();

      const stats1 = monitor.getOperationStats('operation1');
      expect(stats1.count).toBe(1);
      expect(stats1.avgTime).toBeGreaterThan(9);
      expect(stats1.avgTime).toBeLessThan(20);

      const stats2 = monitor.getOperationStats('operation2');
      expect(stats2.count).toBe(1);
      expect(stats2.avgTime).toBeGreaterThan(19);
      expect(stats2.avgTime).toBeLessThan(30);
    });

    test('Calculates statistics correctly', async () => {
      // Add 5 measurements
      for (const duration of [10, 20, 30, 40, 50]) {
        const stop = monitor.start('statTest');
        await new Promise((resolve) => setTimeout(resolve, duration));
        stop();
      }

      const stats = monitor.getOperationStats('statTest');
      expect(stats.count).toBe(5);
      // Allow some timing overhead (11.4ms instead of 10ms)
      expect(stats.minTime).toBeGreaterThan(9);
      expect(stats.minTime).toBeLessThan(15);
      // Allow some timing overhead for max (50.27ms instead of 50ms)
      expect(stats.maxTime).toBeGreaterThan(49);
      expect(stats.maxTime).toBeLessThan(60);
      // Allow some timing overhead for avg (30.6ms instead of 30ms)
      expect(stats.avgTime).toBeGreaterThan(28);
      expect(stats.avgTime).toBeLessThan(35);
    });

    test('Tracks errors', async () => {
      const stop = monitor.start('errorTest', { error: true });
      try {
        throw new Error('Test error');
      } catch {
        stop();
      }

      const stats = monitor.getOperationStats('errorTest');
      expect(stats.count).toBe(1);
      expect(stats.errors).toBe(1);
    });
  });

  describe('Budget violation detection', () => {
    test('Detects budget violations', () => {
      const monitor = createPerformanceMonitor({
        enabled: true,
        budgets: {
          operations: {
            testOperation: 5, // 5ms budget
          },
        },
      });

      const violations: any[] = [];
      monitor.on('budgetViolation', (v) => violations.push(v));

      const stop = monitor.start('testOperation');
      // Busy wait for 10ms
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Busy wait
      }
      stop();

      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('critical');
      expect(violations[0].actual).toBeGreaterThan(10);
      expect(violations[0].percentage).toBeGreaterThan(2); // 10ms / 5ms budget
    });

    test('Detects warning-level violations', () => {
      const monitor = createPerformanceMonitor({
        enabled: true,
        budgets: {
          operations: {
            testOperation: 10, // 10ms budget
          },
        },
      });

      const violations: any[] = [];
      monitor.on('budgetViolation', (v) => violations.push(v));

      const stop = monitor.start('testOperation');
      const start = performance.now();
      while (performance.now() - start < 9) {
        // Busy wait for 9ms (close to 80% of 10ms)
      }
      stop();

      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('warning');
      expect(violations[0].percentage).toBeGreaterThan(0.8);
    });
  });

  describe('Memory measurement', () => {
    test('Measures memory operations', () => {
      const monitor = createPerformanceMonitor({ enabled: true });

      const result = monitor.measureMemory(() => {
        // Create some objects
        const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
        return data;
      });

      expect(result).toHaveLength(100);

      const metrics = monitor.getMetrics();
      expect(metrics.memory.allocations).toBeGreaterThan(0);
    });

    test('Tracks memory usage changes', () => {
      const monitor = createPerformanceMonitor({ enabled: true });

      // Create some objects
      monitor.measureMemory(() => Array.from({ length: 1000 }, (_, i) => i));

      const metrics = monitor.getMetrics();
      expect(metrics.memory.allocations).toBe(1);
      expect(metrics.memory.peakHeapUsed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Async tracking', () => {
    test('Tracks async operations', async () => {
      const monitor = createPerformanceMonitor({ enabled: true });

      const promise = new Promise<number>((resolve) => {
        setTimeout(() => resolve(42), 10);
      });

      await monitor.trackAsync(promise, 'asyncTest');

      const stats = monitor.getOperationStats('asyncTest');
      expect(stats.count).toBe(1);
      expect(stats.avgTime).toBeGreaterThan(9);
    });

    test('Handles async errors', async () => {
      const monitor = createPerformanceMonitor({ enabled: true });

      const promise = Promise.reject(new Error('Test error'));
      await expect(monitor.trackAsync(promise, 'errorTest')).rejects.toThrow(
        'Test error'
      );

      const stats = monitor.getOperationStats('errorTest');
      expect(stats.count).toBe(1);
      expect(stats.errors).toBe(1);
    });
  });

  describe('Budget configuration', () => {
    test('Can update budgets at runtime', () => {
      const monitor = createPerformanceMonitor({
        enabled: true,
        budgets: {
          testOperation: 100,
        },
      });

      // Update budgets
      monitor.setBudgets({
        testOperation: 50,
      });

      const metrics = monitor.getMetrics();
      expect(metrics.budgets.testOperation).toBe(50);
    });

    test('Clears all metrics', () => {
      const monitor = createPerformanceMonitor({ enabled: true });

      // Add some measurements
      const stop = monitor.start('test');
      stop();

      // Clear
      monitor.clear();

      const metrics = monitor.getMetrics();
      expect(metrics.operations.test).toBeUndefined();
    });

    test('Can enable/disable at runtime', () => {
      const monitor = createPerformanceMonitor({ enabled: true });

      // Should be enabled
      expect(isMonitorEnabled(monitor)).toBe(true);

      // Disable
      monitor.setEnabled(false);

      // Should be disabled
      const start = performance.now();
      const stop = monitor.start('test');
      stop();
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(0.1);
    });
  });

  describe('Event system', () => {
    test('Subscribes to budget violations', () => {
      const monitor = createPerformanceMonitor({
        enabled: true,
        budgets: {
          operations: {
            test: 1,
          },
        },
      });

      const violations: any[] = [];
      const unsubscribe = monitor.on('budgetViolation', (v) =>
        violations.push(v)
      );

      const stop = monitor.start('test');
      const start = performance.now();
      while (performance.now() - start < 2) {
        // Busy wait
      }
      stop();

      expect(violations).toHaveLength(1);

      // Unsubscribe
      unsubscribe();

      // Should not receive more events
      const stop2 = monitor.start('test');
      const start2 = performance.now();
      while (performance.now() - start2 < 2) {
        // Busy wait
      }
      stop2();

      expect(violations).toHaveLength(1); // Still 1, not 2
    });

    test('Subscribes to metric updates', () => {
      const monitor = createPerformanceMonitor({ enabled: true });

      const updates: any[] = [];
      const unsubscribe = monitor.on('metricUpdate', (m) => updates.push(m));

      // Make a measurement
      const stop = monitor.start('test');
      stop();

      expect(updates).toHaveLength(1);
      expect(updates[0].operations.test).toBeDefined();

      // Unsubscribe
      unsubscribe();
    });
  });

  describe('Integration with table', () => {
    test('Works with table creation', () => {
      const table = createTable({
        columns: [{ accessorKey: 'name' }],
        data: [{ name: 'Test' }],
        debug: {
          performance: true,
        },
      });

      expect(table.metrics).toBeDefined();
      expect(table.metrics?.operations).toBeDefined();

      table.destroy();
    });

    test('Records state update metrics', () => {
      const table = createTable({
        columns: [{ accessorKey: 'name' }],
        data: [{ name: 'Test' }],
        debug: {
          performance: true,
        },
      });

      // Clear any initial metrics from table creation
      table.metrics?.operations;

      // Make a state update
      table.setState((prev) => ({
        ...prev,
        rowSelection: { 0: true },
      }));

      const metrics = table.metrics;
      expect(metrics?.operations.stateUpdate).toBeDefined();
      // Account for potential initial state updates during table creation
      expect(metrics?.operations.stateUpdate?.count).toBeGreaterThanOrEqual(1);

      table.destroy();
    });

    test('Records row model build metrics', () => {
      const table = createTable({
        columns: [{ accessorKey: 'name' }],
        data: [{ name: 'Test' }],
        debug: {
          performance: true,
        },
      });

      // Access row model
      const model = table.getRowModel();
      expect(model.rows).toHaveLength(1);

      const metrics = table.metrics;
      expect(metrics?.operations.rowModelBuild).toBeDefined();
      // Account for potential initial row model builds during table creation
      expect(metrics?.operations.rowModelBuild?.count).toBeGreaterThanOrEqual(1);

      table.destroy();
    });
  });
});


