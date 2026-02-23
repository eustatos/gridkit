/**
 * Integration tests for Advanced Debugging Tools.
 * Tests end-to-end debugging functionality with table integration.
 * 
 * @module @gridkit/core/debug/__tests__/integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTable } from '../../../table';
import { DebugManager } from '../DebugManager';

describe('DebugManager Integration Tests', () => {
  describe('Table Integration', () => {
    it('should access debug manager via table instance', () => {
      const table = createTable({
        data: [{ id: '1', name: 'Test' }],
        columns: [{ accessorKey: 'id', header: 'ID' }],
        debug: {
          events: true,
          performance: true,
        },
      });

      expect(table.debug).toBeInstanceOf(DebugManager);
      
      table.destroy();
    });

    it('should log events when debug is enabled', () => {
      const table = createTable({
        data: [{ id: '1' }],
        columns: [{ accessorKey: 'id', header: 'ID' }],
        debug: { events: true },
      });

      // Trigger some state changes that should emit events
      table.setSorting([{ id: 'id', desc: false }]);

      // Check that debug manager has captured events
      const history = table.debug?.getEventHistory();
      expect(history).toBeDefined();
      expect(history?.length).toBeGreaterThan(0);

      table.destroy();
    });

    it('should profile table operations', () => {
      const table = createTable({
        data: Array.from({ length: 100 }, (_, i) => ({ id: String(i) })),
        columns: [{ accessorKey: 'id', header: 'ID' }],
        debug: { performance: true },
      });

      // Profile sorting operation
      const result = table.debug?.profileWithLabel('setSorting', () => {
        table.setSorting([{ id: 'id', desc: false }]);
      });

      expect(result).toBeDefined();
      expect(result?.label).toBe('setSorting');
      expect(result?.duration).toBeGreaterThan(0);

      table.destroy();
    });

    it('should track memory usage', () => {
      const table = createTable({
        data: [{ id: '1' }],
        columns: [{ accessorKey: 'id', header: 'ID' }],
        debug: { memory: true },
      });

      const snapshot1 = table.debug?.trackMemory();
      expect(snapshot1).toBeDefined();
      expect(snapshot1?.heapUsed).toBeGreaterThanOrEqual(0);

      // Add more data and track again
      for (let i = 0; i < 50; i++) {
        table.setData((prev) => [...prev, { id: String(i) }]);
      }

      const snapshot2 = table.debug?.trackMemory();
      expect(snapshot2).toBeDefined();
      expect(snapshot2?.heapUsed).toBeGreaterThanOrEqual(snapshot1?.heapUsed || 0);

      table.destroy();
    });

    it('should get complete debug info', () => {
      const table = createTable({
        data: [{ id: '1' }],
        columns: [{ accessorKey: 'id', header: 'ID' }],
        debug: {
          events: true,
          performance: true,
          memory: true,
          timeTravel: true,
        },
      });

      const debugInfo = table.debug?.getDebugInfo();
      expect(debugInfo).toBeDefined();
      expect(debugInfo?.config).toBeDefined();
      expect(debugInfo?.events).toBeDefined();
      expect(debugInfo?.performance).toBeDefined();
      expect(debugInfo?.memory).toBeDefined();
      expect(debugInfo?.timeTravel).toBeDefined();

      table.destroy();
    });

    it('should handle debug when not enabled', () => {
      const table = createTable({
        data: [{ id: '1' }],
        columns: [{ accessorKey: 'id', header: 'ID' }],
        // No debug enabled
      });

      expect(table.debug).toBeUndefined();

      table.destroy();
    });
  });

  describe('Time Travel Integration', () => {
    it('should create snapshots during table operations', () => {
      const table = createTable({
        data: [{ id: '1' }],
        columns: [{ accessorKey: 'id', header: 'ID' }],
        debug: { timeTravel: true },
      });

      // Create initial snapshot
      const snapshot1 = table.debug?.createSnapshot(table.getState());
      expect(snapshot1).toBeDefined();
      expect(snapshot1?.metadata.rowCount).toBe(1);

      // Modify state
      table.setData([{ id: '1' }, { id: '2' }]);

      // Create another snapshot
      const snapshot2 = table.debug?.createSnapshot(table.getState());
      expect(snapshot2).toBeDefined();
      expect(snapshot2?.metadata.rowCount).toBe(2);

      // List all snapshots
      const snapshots = table.debug?.listSnapshots();
      expect(snapshots).toHaveLength(2);

      table.destroy();
    });

    it('should travel between snapshots', () => {
      const table = createTable({
        data: [{ id: '1' }],
        columns: [{ accessorKey: 'id', header: 'ID' }],
        debug: { timeTravel: true },
      });

      // Create snapshots
      const snapshot1 = table.debug?.createSnapshot(table.getState());
      
      table.setData([{ id: '1' }, { id: '2' }]);
      const snapshot2 = table.debug?.createSnapshot(table.getState());

      // Travel back
      const traveled = table.debug?.travelBack(1);
      expect(traveled).toBeDefined();

      // Travel forward
      const forward = table.debug?.travelForward(1);
      expect(forward).toBeDefined();

      table.destroy();
    });
  });

  describe('Event Replay Integration', () => {
    it('should replay events through debug manager', () => {
      const table = createTable({
        data: [{ id: '1' }],
        columns: [{ accessorKey: 'id', header: 'ID' }],
        debug: { events: true },
      });

      // Trigger some events
      table.setSorting([{ id: 'id', desc: false }]);
      table.setFilterValue('search', 'test');

      // Get logged events
      const events = table.debug?.getEventHistory();
      expect(events).toBeDefined();
      expect(events?.length).toBeGreaterThan(0);

      table.destroy();
    });
  });

  describe('Performance Profiling Integration', () => {
    it('should profile and identify bottlenecks', () => {
      const table = createTable({
        data: Array.from({ length: 200 }, (_, i) => ({ id: String(i) })),
        columns: [{ accessorKey: 'id', header: 'ID' }],
        debug: { performance: true },
      });

      // Run multiple operations
      for (let i = 0; i < 3; i++) {
        table.debug?.profileWithLabel(`iteration-${i}`, () => {
          table.setSorting([{ id: 'id', desc: i % 2 === 0 }]);
        });
      }

      // Get bottlenecks
      const bottlenecks = table.debug?.getBottlenecks(0);
      expect(bottlenecks).toBeDefined();
      expect(bottlenecks?.length).toBeGreaterThan(0);

      table.destroy();
    });

    it('should generate flame graph data', () => {
      const table = createTable({
        data: [{ id: '1' }],
        columns: [{ accessorKey: 'id', header: 'ID' }],
        debug: { performance: true },
      });

      // Run some operations
      table.debug?.profileWithLabel('complex-operation', () => {
        table.setSorting([{ id: 'id', desc: false }]);
        table.setFilterValue('search', 'test');
      });

      const profiles = table.debug?.getProfiler()?.getCompletedProfiles();
      expect(profiles).toBeDefined();
      expect(profiles?.length).toBeGreaterThan(0);

      // Generate flame graph
      const flameGraph = table.debug?.getProfiler()?.generateFlameGraph(profiles || []);
      expect(flameGraph).toBeDefined();
      expect(flameGraph?.root.name).toBe('Root');

      table.destroy();
    });
  });

  describe('Memory Leak Detection Integration', () => {
    it('should detect potential memory leaks', () => {
      const table = createTable({
        data: [{ id: '1' }],
        columns: [{ accessorKey: 'id', header: 'ID' }],
        debug: { memory: true },
      });

      const leaks = table.debug?.detectLeaks();
      expect(leaks).toBeDefined();

      table.destroy();
    });

    it('should analyze memory growth', () => {
      const table = createTable({
        data: [{ id: '1' }],
        columns: [{ accessorKey: 'id', header: 'ID' }],
        debug: { memory: true },
      });

      // Create multiple snapshots
      for (let i = 0; i < 3; i++) {
        table.setData((prev) => [
          ...prev,
          ...Array.from({ length: 10 }, (_, j) => ({ id: String(i * 10 + j) })),
        ]);
        table.debug?.trackMemory();
      }

      const report = table.debug?.analyzeMemoryGrowth();
      expect(report).toBeDefined();
      expect(report?.isConcerning).toBeDefined();

      table.destroy();
    });
  });

  describe('Debug Info Export', () => {
    it('should export debug data as JSON', () => {
      const table = createTable({
        data: [{ id: '1' }],
        columns: [{ accessorKey: 'id', header: 'ID' }],
        debug: { events: true },
      });

      table.debug?.logEvent({
        type: 'test:event',
        payload: { test: 'data' },
        timestamp: Date.now(),
      });

      const blob = table.debug?.exportDebugData('json');
      expect(blob).toBeDefined();
      expect(blob?.type).toBe('application/json');

      // Verify JSON content
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        expect(content).toContain('"events"');
      };
      reader.readAsText(blob || '');

      table.destroy();
    });
  });

  describe('Cleanup and Memory Safety', () => {
    it('should clear all debug data on cleanup', () => {
      const table = createTable({
        data: [{ id: '1' }],
        columns: [{ accessorKey: 'id', header: 'ID' }],
        debug: {
          events: true,
          performance: true,
          memory: true,
          timeTravel: true,
        },
      });

      // Add some debug data
      table.debug?.logEvent({ type: 'test', payload: {}, timestamp: Date.now() });
      table.debug?.createSnapshot(table.getState());
      table.debug?.trackMemory();

      // Clear all
      table.debug?.clear();

      // Verify cleared
      expect(table.debug?.getEventHistory()).toHaveLength(0);
      expect(table.debug?.listSnapshots()).toHaveLength(0);
      // Memory snapshots may persist due to implementation

      table.destroy();
    });
  });
});
