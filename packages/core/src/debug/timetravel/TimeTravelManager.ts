/**
 * Time-travel debugging manager for GridKit.
 * Provides snapshot creation, restoration, and time-travel capabilities.
 * 
 * @module @gridkit/core/debug/timetravel
 */

import type { TableState } from '@/types/table/TableState';
import type { TableSnapshot } from '@/debug/types';
import type { GridEvent } from '@/events/types/base';
import { CircularBuffer } from '@/debug/types';
import type { RowData } from '@/types';

/**
 * Time-travel debugging manager
 */
export class TimeTravelManager {
  private snapshots: CircularBuffer<TableSnapshot>;
  private eventStore: Map<number, GridEvent> = new Map();
  private currentIndex = -1; // Starts at -1, becomes last index after first snapshot
  private timestampCounter = 0;
  private isPlaying = false;

  constructor(capacity: number = 100) {
    this.snapshots = new CircularBuffer<TableSnapshot>(capacity);
  }

  /**
   * Create a snapshot of current state
   */
  createSnapshot<TData extends RowData = RowData>(state: TableState<TData>, eventIndex: number): TableSnapshot {
    const timestamp = ++this.timestampCounter;
    const memory = typeof process !== 'undefined' && process.memoryUsage
      ? process.memoryUsage().heapUsed
      : 0;

    const snapshot: TableSnapshot = {
      timestamp,
      eventIndex,
      state,
      metadata: {
        rowCount: state.data.length,
        columnCount: state.columnOrder.length,
        memory,
      },
    };

    this.snapshots.push(snapshot);
    // Update currentIndex to point to the new snapshot (last element)
    this.currentIndex = this.snapshots.getSize() - 1;
    return snapshot;
  }

  /**
   * Get snapshot by timestamp
   */
  getSnapshot(timestamp: number): TableSnapshot | undefined {
    return this.snapshots.getAll().find(s => s.timestamp === timestamp);
  }

  /**
   * List all snapshots
   */
  listSnapshots(): TableSnapshot[] {
    return this.snapshots.getAll();
  }

  /**
   * Travel to specific timestamp
   */
  travelTo(timestamp: number): TableSnapshot | undefined {
    const snapshot = this.getSnapshot(timestamp);
    if (snapshot) {
      this.currentIndex = this.snapshots.getAll().findIndex(s => s.timestamp === timestamp);
    }
    return snapshot;
  }

  /**
   * Travel back by number of snapshots
   */
  travelBack(steps: number = 1): TableSnapshot | undefined {
    const allSnapshots = this.snapshots.getAll();
    if (allSnapshots.length === 0) {
      return undefined;
    }
    // travelBack(1) from newest should return second newest (moving backward in time)
    // currentIndex points to current position, so we go back
    const newIndex = Math.max(0, this.currentIndex - steps);
    if (newIndex < allSnapshots.length) {
      this.currentIndex = newIndex;
      return allSnapshots[newIndex];
    }
    return undefined;
  }

  /**
   * Travel forward by number of snapshots
   */
  travelForward(steps: number = 1): TableSnapshot | undefined {
    const allSnapshots = this.snapshots.getAll();
    if (allSnapshots.length === 0) {
      return undefined;
    }
    // travelForward(1) from position should move forward (newer snapshots)
    const newIndex = Math.min(allSnapshots.length - 1, this.currentIndex + steps);
    if (newIndex >= 0) {
      this.currentIndex = newIndex;
      return allSnapshots[newIndex];
    }
    return undefined;
  }

  /**
   * Replay snapshots within range
   */
  replay(from: number, to: number, speed: number = 1): void {
    this.isPlaying = true;
    const snapshots = this.snapshots.getAll();
    const fromIndex = snapshots.findIndex(s => s.timestamp === from);
    const toIndex = snapshots.findIndex(s => s.timestamp === to);

    if (fromIndex === -1 || toIndex === -1 || fromIndex > toIndex) {
      this.isPlaying = false;
      return;
    }

    const interval = Math.max(100, 1000 / speed);
    let currentIndex = fromIndex;

    const replayInterval = setInterval(() => {
      if (!this.isPlaying || currentIndex > toIndex) {
        clearInterval(replayInterval);
        this.isPlaying = false;
        return;
      }

      this.currentIndex = currentIndex;
      currentIndex++;
    }, interval);
  }

  /**
   * Pause current replay
   */
  pause(): void {
    this.isPlaying = false;
  }

  /**
   * Resume paused replay
   */
  resume(): void {
    this.isPlaying = true;
  }

  /**
   * Stop replay
   */
  stop(): void {
    this.isPlaying = false;
    this.currentIndex = this.snapshots.getSize() - 1;
  }

  /**
   * Store an event for replay
   */
  storeEvent(event: GridEvent, timestamp: number): void {
    this.eventStore.set(timestamp, event);
  }

  /**
   * Get stored event by timestamp
   */
  getEvent(timestamp: number): GridEvent | undefined {
    return this.eventStore.get(timestamp);
  }

  /**
   * Get current snapshot index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get current snapshot
   */
  getCurrentSnapshot(): TableSnapshot | undefined {
    const all = this.snapshots.getAll();
    if (this.currentIndex >= 0 && this.currentIndex < all.length) {
      return all[this.currentIndex];
    }
    return undefined;
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    this.snapshots.clear();
    this.eventStore.clear();
    this.currentIndex = -1;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): {
    snapshotCount: number;
    currentTimestamp: number;
    capacity: number;
    usage: number;
  } {
    const all = this.snapshots.getAll();
    const current = this.getCurrentSnapshot();

    return {
      snapshotCount: this.snapshots.getSize(),
      currentTimestamp: current?.timestamp || 0,
      capacity: this.snapshots.getCapacity(),
      usage: this.snapshots.getSize() / this.snapshots.getCapacity() * 100,
    };
  }
}
