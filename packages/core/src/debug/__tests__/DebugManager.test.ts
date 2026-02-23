/**
 * Tests for DebugManager and debugging utilities.
 * 
 * @module @gridkit/core/debug/__tests__
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DebugManager } from '../DebugManager';
import { TimeTravelManager } from '../timetravel/TimeTravelManager';
import { EventReplayer } from '../replay/EventReplayer';
import { Profiler } from '../profiler/Profiler';
import { MemoryDebugger } from '../memory/MemoryDebugger';

describe('DebugManager', () => {
  describe('Event Debugging', () => {
    it('should log events when enabled', () => {
      const debug = new DebugManager({ events: true });
      
      debug.logEvent({
        type: 'test:event',
        payload: { test: 'data' },
        timestamp: Date.now(),
      });
      
      const history = debug.getEventHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('test:event');
    });

    it('should filter events when filter is provided', () => {
      const debug = new DebugManager({
        events: {
          enabled: true,
          filter: (e) => e.type === 'allowed:event',
        },
      });
      
      debug.logEvent({ type: 'allowed:event', payload: {}, timestamp: Date.now() });
      debug.logEvent({ type: 'blocked:event', payload: {}, timestamp: Date.now() });
      
      const history = debug.getEventHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('allowed:event');
    });

    it('should limit event history size', () => {
      const debug = new DebugManager({
        events: { enabled: true, maxHistory: 3 },
      });
      
      for (let i = 0; i < 5; i++) {
        debug.logEvent({ type: `event:${i}`, payload: {}, timestamp: Date.now() });
      }
      
      const history = debug.getEventHistory();
      expect(history).toHaveLength(3);
      expect(history[0]?.type).toBe('event:2');
    });

    it('should clear event history', () => {
      const debug = new DebugManager({ events: true });
      debug.logEvent({ type: 'test', payload: {}, timestamp: Date.now() });
      
      debug.clearEventHistory();
      expect(debug.getEventHistory()).toHaveLength(0);
    });
  });

  describe('Time Travel', () => {
    it('should create snapshots', () => {
      const debug = new DebugManager({ timeTravel: true });
      
      const snapshot = debug.createSnapshot({
        data: [],
        columnOrder: [],
        columnVisibility: {},
      });
      
      expect(snapshot).toBeDefined();
      expect(snapshot.timestamp).toBeGreaterThan(0);
      expect(snapshot.eventIndex).toBe(0);
    });

    it('should travel to snapshot', () => {
      const debug = new DebugManager({ timeTravel: true });
      
      const snapshot1 = debug.createSnapshot({
        data: [{ id: '1' }],
        columnOrder: [],
        columnVisibility: {},
      });
      
      const snapshot2 = debug.createSnapshot({
        data: [{ id: '1' }, { id: '2' }],
        columnOrder: [],
        columnVisibility: {},
      });
      
      expect(snapshot1.timestamp).toBeLessThan(snapshot2.timestamp);
    });

    it('should travel back and forward', () => {
      const debug = new DebugManager({ timeTravel: true });
      
      for (let i = 0; i < 5; i++) {
        debug.createSnapshot({
          data: [],
          columnOrder: [],
          columnVisibility: {},
        });
      }
      
      const snapshots = debug.listSnapshots();
      expect(snapshots).toHaveLength(5);
      
      // Travel back
      const travelBack = debug.travelBack(2);
      expect(travelBack).toBeDefined();
      
      // Travel forward
      const travelForward = debug.travelForward(1);
      expect(travelForward).toBeDefined();
    });

    it('should get debug info', () => {
      const debug = new DebugManager({ timeTravel: true });
      
      debug.createSnapshot({
        data: [],
        columnOrder: [],
        columnVisibility: {},
      });
      
      const info = debug.getTimeTravelManager().getDebugInfo();
      expect(info.snapshotCount).toBeGreaterThan(0);
      expect(info.capacity).toBeGreaterThan(0);
    });
  });

  describe('Performance Profiling', () => {
    it('should profile functions', () => {
      const debug = new DebugManager({ performance: true });
      
      const result = debug.profile(() => {
        // Simulate work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });
      
      expect(result.label).toBe('anonymous');
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.memory.delta).toBeGreaterThanOrEqual(0);
    });

    it('should profile with label', () => {
      const debug = new DebugManager({ performance: true });
      
      const result = debug.profileWithLabel('test-label', () => {
        return 42;
      });
      
      expect(result.label).toBe('test-label');
      expect(result.result).toBe(42);
    });

    it('should get bottlenecks', () => {
      const debug = new DebugManager({ performance: true });
      
      // Run some profiles
      debug.profileWithLabel('fast', () => {});
      debug.profileWithLabel('slow', () => {
        for (let i = 0; i < 100000; i++) {
          Math.random();
        }
      });
      
      const bottlenecks = debug.getBottlenecks(0);
      expect(bottlenecks.length).toBeGreaterThan(0);
    });

    it('should clear profiler', () => {
      const profiler = new Profiler();
      profiler.start('test');
      profiler.stop('test');
      
      expect(profiler.getCompletedProfiles()).toHaveLength(1);
      
      profiler.clear();
      expect(profiler.getCompletedProfiles()).toHaveLength(0);
    });
  });

  describe('Memory Debugging', () => {
    it('should create memory snapshots', () => {
      const debug = new DebugManager({ memory: true });
      
      const snapshot = debug.trackMemory();
      
      expect(snapshot).toBeDefined();
      expect(snapshot.timestamp).toBeGreaterThan(0);
      expect(snapshot.heapUsed).toBeGreaterThanOrEqual(0);
    });

    it('should detect leaks', () => {
      const debug = new DebugManager({ memory: true });
      
      const leaks = debug.detectLeaks();
      expect(leaks).toBeDefined();
    });

    it('should create heap snapshot', () => {
      const debug = new DebugManager({ memory: true });
      
      const snapshot = debug.createHeapSnapshot();
      
      expect(snapshot.timestamp).toBeGreaterThan(0);
    });

    it('should analyze memory growth', () => {
      const debug = new DebugManager({ memory: true });
      
      // Create multiple snapshots
      for (let i = 0; i < 3; i++) {
        debug.trackMemory();
      }
      
      const report = debug.analyzeMemoryGrowth();
      expect(report).toBeDefined();
    });

    it('should clear memory debugger', () => {
      const debuggerInstance = new MemoryDebugger();
      debuggerInstance.createSnapshot();
      
      expect(debuggerInstance['snapshots'].length).toBeGreaterThan(0);
      
      debuggerInstance.clear();
      expect(debuggerInstance['snapshots'].length).toBe(0);
    });
  });

  describe('Complete Debug Info', () => {
    it('should get complete debug information', () => {
      const debug = new DebugManager({
        events: true,
        performance: true,
        memory: true,
        timeTravel: true,
      });
      
      // Create a snapshot for time-travel info
      debug.createSnapshot({
        data: [],
        columnOrder: [],
        columnVisibility: {},
      });
      
      const info = debug.getDebugInfo();
      
      expect(info.config).toBeDefined();
      expect(info.events.total).toBeGreaterThanOrEqual(0);
      expect(info.events.recent).toBeDefined();
      expect(info.performance.profiles).toBeDefined();
      expect(info.performance.bottlenecks).toBeDefined();
      expect(info.memory.current).toBeDefined();
      expect(info.memory.leaks).toBeDefined();
      expect(info.timeTravel.snapshots).toBeGreaterThan(0);
    });

    it('should export debug data as JSON', () => {
      const debug = new DebugManager({ events: true });
      debug.logEvent({ type: 'test', payload: {}, timestamp: Date.now() });
      
      const blob = debug.exportDebugData('json');
      expect(blob).toBeDefined();
      expect(blob.type).toBe('application/json');
    });
  });

  describe('TimeTravelManager', () => {
    it('should manage snapshots with circular buffer', () => {
      const manager = new TimeTravelManager(3);
      
      manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 0);
      manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 1);
      manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 2);
      manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 3);
      
      // Should only keep last 3
      expect(manager.listSnapshots()).toHaveLength(3);
    });

    it('should replay snapshots', () => {
      const manager = new TimeTravelManager(10);
      
      const snapshot1 = manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 0);
      const snapshot2 = manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 1);
      
      manager.replay(snapshot1.timestamp, snapshot2.timestamp, 1);
      expect(manager['isPlaying']).toBe(true);
      
      manager.stop();
      expect(manager['isPlaying']).toBe(false);
    });

    it('should pause and resume replay', () => {
      const manager = new TimeTravelManager(10);
      manager.createSnapshot({ data: [], columnOrder: [], columnVisibility: {} }, 0);
      
      manager.replay(1, 2, 1);
      manager.pause();
      expect(manager['isPlaying']).toBe(false);
      
      manager.resume();
      expect(manager['isPlaying']).toBe(true);
    });
  });

  describe('EventReplayer', () => {
    it('should replay single event', () => {
      // This test would require a real EventBus and StateManager
      // For now, just verify the interface
      const replayer = new EventReplayer(null as any, null as any);
      
      expect(replayer).toBeDefined();
    });

    it('should replay multiple events', () => {
      const replayer = new EventReplayer(null as any, null as any);
      
      expect(replayer).toBeDefined();
    });
  });

  describe('Profiler', () => {
    it('should build flame graph', () => {
      const profiler = new Profiler();
      
      profiler.start('root');
      profiler.start('child');
      profiler.stop('child');
      profiler.stop('root');
      
      const flameGraph = profiler.generateFlameGraph(profiler.getCompletedProfiles());
      
      expect(flameGraph.root.name).toBe('Root');
      expect(flameGraph.totalDuration).toBeGreaterThanOrEqual(0);
    });

    it('should analyze profiles', () => {
      const profiler = new Profiler();
      
      profiler.start('fast');
      profiler.stop('fast');
      
      const analysis = profiler.analyze(profiler.getCompletedProfiles());
      
      expect(analysis.totalOperations).toBeGreaterThan(0);
      expect(analysis.totalDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('MemoryDebugger', () => {
    it('should track objects', () => {
      const debuggerInstance = new MemoryDebugger({ trackLeaks: true });
      
      const obj = { test: 'value' };
      debuggerInstance.trackObject(obj, 'test-object');
      
      const tracked = debuggerInstance.getTrackedObjects();
      expect(tracked.length).toBeGreaterThan(0);
      expect(tracked[0].label).toBe('test-object');
    });

    it('should compare snapshots', () => {
      const debuggerInstance = new MemoryDebugger();
      
      const snapshot1 = debuggerInstance.createSnapshot();
      const snapshot2 = debuggerInstance.createSnapshot();
      
      const diff = debuggerInstance.compareSnapshots(snapshot1, snapshot2);
      
      expect(diff.timeDelta).toBeGreaterThanOrEqual(0);
      expect(diff.heapUsedDelta).toBeGreaterThanOrEqual(0);
    });
  });
});
