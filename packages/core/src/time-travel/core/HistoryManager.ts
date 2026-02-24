import { Snapshot } from "../types";

export class HistoryManager {
  private past: Snapshot[] = [];
  private future: Snapshot[] = [];
  private current: Snapshot | null = null;
  private maxHistory: number;

  constructor(maxHistory: number = 50) {
    this.maxHistory = maxHistory;
  }

  add(snapshot: Snapshot): void {
    if (this.current) {
      this.past.push(this.current);
      if (this.past.length > this.maxHistory) {
        this.past = this.past.slice(-this.maxHistory);
      }
    }
    this.current = snapshot;
    this.future = [];
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
    if (!this.canUndo()) return null;

    const newFuture = this.current;
    const newCurrent = this.past.pop() || null;
    
    if (newCurrent) {
      this.future.unshift(newFuture);
      this.current = newCurrent;
    }
    
    return newCurrent;
  }

  redo(): Snapshot | null {
    if (!this.canRedo()) return null;

    const newPast = this.current;
    const newCurrent = this.future.shift() || null;
    
    if (newCurrent) {
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
}
