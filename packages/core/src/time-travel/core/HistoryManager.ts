import { Snapshot } from "../types";
import type { HistoryEvent, HistoryStats } from "./types";

export class HistoryManager {
  private past: Snapshot[] = [];
  private future: Snapshot[] = [];
  private current: Snapshot | null = null;
  private maxHistory: number;
  private listeners: Set<(event: HistoryEvent) => void> = new Set();

  constructor(maxHistory: number = 50) {
    this.maxHistory = maxHistory;
  }

  add(snapshot: Snapshot): void {
    console.log(`[HISTORY.add] Adding snapshot: ${snapshot.metadata.action || 'unknown'}, past.length: ${this.past.length}, current: ${this.current?.metadata.action || 'none'}`);
    if (this.current) {
      this.past.push(this.current);
      console.log(`[HISTORY.add] Pushed to past, past.length now: ${this.past.length}`);
    }
    this.current = snapshot;
    this.future = [];
    
    // Enforce maxHistory: past + current <= maxHistory
    // Keep only the last (maxHistory - 1) snapshots in past
    if (this.past.length >= this.maxHistory) {
      this.past = this.past.slice(1);
      console.log(`[HISTORY.add] Trimmed past to ${this.past.length} items`);
    }
    console.log(`[HISTORY.add] Added. Total: ${this.getAll().length} (past: ${this.past.length}, current: ${this.current ? 1 : 0}, future: ${this.future.length})`);
  }

  getCurrent(): Snapshot | null {
    return this.current;
  }

  getAll(): Snapshot[] {
    return [
      ...this.past,
      ...(this.current ? [this.current] : []),
      ...this.future,
    ];
  }

  // Методы для навигации
  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  undo(): Snapshot | null {
    console.log(`[HISTORY.undo] canUndo: ${this.canUndo()}, past.length: ${this.past.length}, future.length: ${this.future.length}`);
    if (!this.canUndo()) return null;

    const newFuture = this.current;
    const newCurrent = this.past.pop() || null;
    
    if (newCurrent && newFuture) {
      this.future.unshift(newFuture);
      this.current = newCurrent;
      console.log(`[HISTORY.undo] Popped from past, new current: ${newCurrent.metadata.action || 'unknown'}, value: ${Object.values(newCurrent.state)[0]?.value}`);
    }
    
    return newCurrent;
  }

  redo(): Snapshot | null {
    if (!this.canRedo()) return null;

    const newPast = this.current;
    const newCurrent = this.future.shift() || null;
    
    if (newCurrent && newPast) {
      this.past.push(newPast);
      this.current = newCurrent;
    }
    
    return newCurrent;
  }

  jumpTo(index: number): Snapshot | null {
    const allSnapshots = this.getAll();
    
    // Check if index is valid
    if (index < 0 || index >= allSnapshots.length) {
      return null;
    }

    // If already at the target index, return current snapshot
    const currentIndex = this.past.length;
    if (index === currentIndex) {
      return this.current;
    }

    const targetSnapshot = allSnapshots[index];

    // Reset history
    this.past = allSnapshots.slice(0, index);
    this.future = allSnapshots.slice(index + 1);
    this.current = targetSnapshot;

    return targetSnapshot;
  }

  // Остальные методы...

  /**
   * Clear all history
   */
  clear(): void {
    this.past = [];
    this.future = [];
    this.current = null;
    
    this.emit({
      type: "change",
      operation: { type: "clear" },
      timestamp: Date.now(),
    });
  }

  /**
   * Get history statistics
   */
  getStats(): HistoryStats {
    const all = this.getAll();
    return {
      totalSnapshots: all.length,
      pastCount: this.past.length,
      futureCount: this.future.length,
      hasCurrent: !!this.current,
      estimatedMemoryUsage: this.estimateMemoryUsage(),
      oldestTimestamp: this.past.length > 0 ? this.past[0].metadata.timestamp : undefined,
      newestTimestamp: this.current ? this.current.metadata.timestamp : undefined,
    };
  }

  /**
   * Subscribe to history events
   * @param listener Event listener
   * @returns Unsubscribe function
   */
  subscribe(listener: (event: HistoryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    // Simple estimation: count properties and approx size
    let size = 0;
    
    const estimateSnapshotSize = (snapshot: Snapshot): number => {
      let snapshotSize = 0;
      snapshotSize += snapshot.id.length * 2; // UTF-16
      snapshotSize += (snapshot.metadata.action?.length || 0) * 2;
      snapshotSize += 24; // metadata overhead
      snapshotSize += Object.keys(snapshot.state).length * 50; // rough estimate per atom
      return snapshotSize;
    };
    
    this.past.forEach((s) => (size += estimateSnapshotSize(s)));
    this.future.forEach((s) => (size += estimateSnapshotSize(s)));
    if (this.current) {
      size += estimateSnapshotSize(this.current);
    }
    
    return size;
  }

  /**
   * Emit history event
   */
  private emit(event: HistoryEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}
