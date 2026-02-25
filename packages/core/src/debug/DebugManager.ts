/**
 * Main debug manager for GridKit.
 * Coordinates all debugging functionality including events, performance, memory, and time-travel.
 * 
 * @module @gridkit/core/debug
 */

import type { GridEvent } from '@/events/types/base';
import type { TableState } from '@/types/table/TableState';
import type { DebugConfig, DebugInfo, ProfilingResult, MemorySnapshot, DebugMemoryLeak, TableSnapshot, ProfilingAnalysis, ProfilerBottleneck } from './types';
import { TimeTravelManager } from './timetravel/TimeTravelManager';
import { EventReplayer } from './replay/EventReplayer';
import { Profiler } from './profiler/Profiler';
import { MemoryDebugger } from './memory/MemoryDebugger';
import type { RowData } from '@/types';

/**
 * Debug manager for GridKit tables
 */
export class DebugManager {
  private config: DebugConfig;
  private eventHistory: GridEvent[] = [];
  private timeTravelManager: TimeTravelManager;
  private profiler: Profiler;
  private memoryDebugger: MemoryDebugger;
  private eventReplayer: EventReplayer | null = null;

  constructor(
    config: DebugConfig,
    private eventBus?: any,
    private stateManager?: any
  ) {
    this.config = config;
    this.timeTravelManager = new TimeTravelManager(config.timeTravel === true ? 100 : (config.timeTravel as any)?.maxSnapshots || 100);
    this.profiler = new Profiler();
    this.memoryDebugger = new MemoryDebugger({
      enabled: config.memory !== false,
      interval: config.memory && typeof config.memory === 'object' ? config.memory.interval : 1000,
      trackLeaks: config.memory && typeof config.memory === 'object' ? config.memory.trackLeaks : true,
    });

    if (eventBus && stateManager) {
      this.eventReplayer = new EventReplayer(eventBus, stateManager);
    }
  }

  // ==================== Event Debugging ====================

  /**
   * Log an event
   */
  logEvent(event: GridEvent): void {
    if (!this.config.events) {
      return;
    }

    // Apply filter if configured
    if (this.config.events !== true && this.config.events.filter) {
      if (!this.config.events.filter(event)) {
        return;
      }
    }

    this.eventHistory.push(event);

    // Limit history size
    const maxHistory = this.config.events !== true && this.config.events.maxHistory
      ? this.config.events.maxHistory
      : 1000;
    
    if (this.eventHistory.length > maxHistory) {
      this.eventHistory.shift();
    }

    // Output to console
    this.outputEvent(event);
  }

  /**
   * Get event history with optional filter
   */
  getEventHistory(filter?: (event: GridEvent) => boolean): GridEvent[] {
    if (!filter) {
      return this.eventHistory;
    }
    return this.eventHistory.filter(filter);
  }

  /**
   * Clear event history
   */
  clearEventHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Output event to configured destination
   */
  private outputEvent(event: GridEvent): void {
    const output = this.config.output || 'console';

    if (output === 'console') {
      console.log('[GridKit Debug]', event.type, event.payload || {});
    }

    if (output === 'devtools' && typeof window !== 'undefined' && (window as any).__GRIDKIT_DEBUG__) {
      (window as any).__GRIDKIT_DEBUG__.emit(event);
    }
  }

  // ==================== Time Travel ====================

  /**
   * Create a snapshot
   */
  createSnapshot<TData extends RowData = RowData>(state?: TableState<TData>, timestamp?: number): TableSnapshot {
    if (!this.config.timeTravel) {
      throw new Error('Time travel debugging is not enabled');
    }

    const snapshotState = state || ({ data: [] as TData[], columnOrder: [], columnVisibility: {}, rowSelection: {}, expanded: {} } as Partial<TableState<TData>> as TableState<TData>);
    return this.timeTravelManager.createSnapshot<TData>(snapshotState, timestamp ? 0 : this.eventHistory.length);
  }

  /**
   * Restore a snapshot
   */
  restoreSnapshot(timestamp: number): void {
    if (!this.config.timeTravel) {
      throw new Error('Time travel debugging is not enabled');
    }

    const snapshot = this.timeTravelManager.travelTo(timestamp);
    if (snapshot && this.stateManager) {
      this.stateManager.setState(snapshot.state);
    }
  }

  /**
   * List all snapshots
   */
  listSnapshots(): TableSnapshot[] {
    return this.timeTravelManager.listSnapshots();
  }

  /**
   * Travel back
   */
  travelBack(steps: number = 1): TableSnapshot | undefined {
    if (!this.config.timeTravel) {
      throw new Error('Time travel debugging is not enabled');
    }
    return this.timeTravelManager.travelBack(steps);
  }

  /**
   * Travel forward
   */
  travelForward(steps: number = 1): TableSnapshot | undefined {
    if (!this.config.timeTravel) {
      throw new Error('Time travel debugging is not enabled');
    }
    return this.timeTravelManager.travelForward(steps);
  }

  // ==================== Event Replay ====================

  /**
   * Replay events
   */
  replayEvents(events: GridEvent[], options?: any): void {
    if (!this.eventReplayer) {
      throw new Error('Event replayer not initialized. Pass eventBus and stateManager to constructor.');
    }
    this.eventReplayer.replayEvents(events, options);
  }

  /**
   * Replay from snapshot
   */
  replayFromSnapshot(timestamp: number): void {
    const snapshot = this.timeTravelManager.getSnapshot(timestamp);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${timestamp}`);
    }

    this.replayEvents(this.eventHistory.slice(0, snapshot.eventIndex));
  }

  // ==================== Performance Profiling ====================

  /**
   * Profile a function
   */
  profile<T>(fn: () => T): ProfilingResult<T> {
    if (!this.config.performance) {
      return { label: 'anonymous', duration: 0, memory: { before: 0, after: 0, delta: 0 }, operations: [] };
    }

    const label = 'anonymous';
    return this.profiler.profile(label, fn);
  }

  /**
   * Profile a specific function with label
   */
  profileWithLabel<T>(label: string, fn: () => T): ProfilingResult<T> {
    if (!this.config.performance) {
      return { label, duration: 0, memory: { before: 0, after: 0, delta: 0 }, operations: [] };
    }

    return this.profiler.profile(label, fn);
  }

  /**
   * Start profiling
   */
  startProfiling(label: string): void {
    if (this.config.performance) {
      this.profiler.start(label);
    }
  }

  /**
   * Stop profiling
   */
  stopProfiling(label: string): ProfilingResult {
    if (this.config.performance) {
      return this.profiler.stop(label);
    }
    return { label, duration: 0, memory: { before: 0, after: 0, delta: 0 }, operations: [] };
  }

  /**
   * Get performance bottlenecks
   */
  getBottlenecks(threshold: number = 100): ProfilerBottleneck[] {
    return this.profiler.getBottlenecks(threshold);
  }

  // ==================== Memory Debugging ====================

  /**
   * Track memory
   */
  trackMemory(): MemorySnapshot {
    return this.memoryDebugger.createSnapshot();
  }

  /**
   * Detect memory leaks
   */
  detectLeaks(): DebugMemoryLeak[] {
    return this.memoryDebugger.detectLeaks();
  }

  /**
   * Create heap snapshot
   */
  createHeapSnapshot(): any {
    return this.memoryDebugger.createHeapSnapshot();
  }

  /**
   * Analyze memory growth
   */
  analyzeMemoryGrowth(): any {
    return this.memoryDebugger.analyzeMemoryGrowth();
  }

  // ==================== Debug Info ====================

  /**
   * Get complete debug information
   */
  getDebugInfo(): DebugInfo {
    const config = this.config;

    const eventHistory = this.getEventHistory();
    const events = {
      total: eventHistory.length,
      recent: eventHistory.slice(-100),
    };

    const performance = {
      profiles: this.profiler.getCompletedProfiles(),
      bottlenecks: this.getBottlenecks(100),
    };

    const currentMemory = this.memoryDebugger.createSnapshot();
    const memory = {
      current: currentMemory,
      leaks: this.detectLeaks(),
    };

    const timeTravelInfo = this.timeTravelManager.getDebugInfo();
    const timeTravel = {
      snapshots: timeTravelInfo.snapshotCount,
      currentSnapshot: timeTravelInfo.currentTimestamp,
    };

    return {
      config,
      events,
      performance,
      memory,
      timeTravel,
    };
  }

  /**
   * Export debug data
   */
  exportDebugData(format: 'json' | 'zip' = 'json'): Blob {
    const debugInfo = this.getDebugInfo();
    const data = JSON.stringify(debugInfo, null, 2);
    return new Blob([data], { type: 'application/json' });
  }

  // ==================== Helpers ====================

  /**
   * Clear all debug data
   */
  clear(): void {
    this.clearEventHistory();
    this.timeTravelManager.clear();
    this.profiler.clear();
    this.memoryDebugger.clear();
  }

  /**
   * Get time travel manager
   */
  getTimeTravelManager(): TimeTravelManager {
    return this.timeTravelManager;
  }

  /**
   * Get profiler
   */
  getProfiler(): Profiler {
    return this.profiler;
  }

  /**
   * Get memory debugger
   */
  getMemoryDebugger(): MemoryDebugger {
    return this.memoryDebugger;
  }

  /**
   * Get event replayer
   */
  getEventReplayer(): EventReplayer | null {
    return this.eventReplayer;
  }
}
