/**
 * HistoryStack - Manages a stack-based history with size limits
 */

import type {
  StackConfig,
  StackEvent,
  StackStats,
  StackSnapshot,
} from "./types";

export class HistoryStack<T> {
  private items: T[] = [];
  private maxSize: number;
  private listeners: Set<(event: StackEvent<T>) => void> = new Set();
  private version: number = 0;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  /**
   * Push an item onto the stack
   * @param item Item to push
   * @returns New stack size
   */
  push(item: T): number {
    this.items.push(item);
    this.version++;

    // Enforce size limit
    if (this.items.length > this.maxSize) {
      const removed = this.items.shift();
      this.emit("evict", { item: removed, reason: "size_limit" });
    }

    this.emit("push", { item });
    return this.size();
  }

  /**
   * Pop an item from the stack
   * @returns The popped item or undefined if stack is empty
   */
  pop(): T | undefined {
    const item = this.items.pop();
    if (item) {
      this.version++;
      this.emit("pop", { item });
    }
    return item;
  }

  /**
   * Peek at the top item without removing it
   * @returns The top item or undefined
   */
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  /**
   * Get item at specific index
   * @param index Index (0-based from bottom)
   * @returns Item or undefined
   */
  at(index: number): T | undefined {
    return this.items[index];
  }

  /**
   * Get item from the top (negative index from top)
   * @param offset Offset from top (0 = top, 1 = second from top)
   * @returns Item or undefined
   */
  fromTop(offset: number = 0): T | undefined {
    return this.items[this.items.length - 1 - offset];
  }

  /**
   * Get item from the bottom
   * @param offset Offset from bottom
   * @returns Item or undefined
   */
  fromBottom(offset: number = 0): T | undefined {
    return this.items[offset];
  }

  /**
   * Clear all items
   */
  clear(): void {
    const oldItems = [...this.items];
    this.items = [];
    this.version++;
    this.emit("clear", { items: oldItems });
  }

  /**
   * Get all items as array
   */
  toArray(): T[] {
    return [...this.items];
  }

  /**
   * Get stack size
   */
  size(): number {
    return this.items.length;
  }

  /**
   * Check if stack is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Check if stack is full
   */
  isFull(): boolean {
    return this.items.length >= this.maxSize;
  }

  /**
   * Get remaining capacity
   */
  remainingCapacity(): number {
    return Math.max(0, this.maxSize - this.items.length);
  }

  /**
   * Resize the stack
   * @param newSize New maximum size
   */
  resize(newSize: number): void {
    const oldSize = this.maxSize;
    this.maxSize = newSize;

    // Trim if necessary
    while (this.items.length > this.maxSize) {
      const removed = this.items.shift();
      this.emit("evict", { item: removed, reason: "resize" });
    }

    this.emit("resize", { oldSize, newSize });
  }

  /**
   * Find items matching predicate
   * @param predicate Search function
   * @returns Matching items
   */
  find(predicate: (item: T, index: number) => boolean): T[] {
    return this.items.filter(predicate);
  }

  /**
   * Find first item matching predicate
   * @param predicate Search function
   * @returns First matching item or undefined
   */
  findFirst(predicate: (item: T, index: number) => boolean): T | undefined {
    return this.items.find(predicate);
  }

  /**
   * Find last item matching predicate
   * @param predicate Search function
   * @returns Last matching item or undefined
   */
  findLast(predicate: (item: T, index: number) => boolean): T | undefined {
    return [...this.items].reverse().find((item, reverseIndex) => {
      const originalIndex = this.items.length - 1 - reverseIndex;
      return predicate(item, originalIndex);
    });
  }

  /**
   * Map over items
   * @param mapper Mapping function
   * @returns Mapped array
   */
  map<U>(mapper: (item: T, index: number) => U): U[] {
    return this.items.map(mapper);
  }

  /**
   * Filter items
   * @param predicate Filter function
   * @returns Filtered array
   */
  filter(predicate: (item: T, index: number) => boolean): T[] {
    return this.items.filter(predicate);
  }

  /**
   * Reduce items
   * @param reducer Reducer function
   * @param initialValue Initial value
   * @returns Reduced value
   */
  reduce<U>(
    reducer: (acc: U, item: T, index: number) => U,
    initialValue: U,
  ): U {
    return this.items.reduce(reducer, initialValue);
  }

  /**
   * Get stack statistics
   */
  getStats(): StackStats {
    return {
      size: this.size(),
      maxSize: this.maxSize,
      isEmpty: this.isEmpty(),
      isFull: this.isFull(),
      remainingCapacity: this.remainingCapacity(),
      version: this.version,
      oldestItem: this.fromBottom(0),
      newestItem: this.fromTop(0),
    };
  }

  /**
   * Create a snapshot of current state
   */
  snapshot(): StackSnapshot<T> {
    return {
      items: this.toArray(),
      maxSize: this.maxSize,
      version: this.version,
      timestamp: Date.now(),
    };
  }

  /**
   * Restore from snapshot
   * @param snapshot Snapshot to restore
   */
  restore(snapshot: StackSnapshot<T>): void {
    this.items = [...snapshot.items];
    this.maxSize = snapshot.maxSize;
    this.version = snapshot.version;
    this.emit("restore", { snapshot });
  }

  /**
   * Subscribe to stack events
   * @param listener Event listener
   * @returns Unsubscribe function
   */
  subscribe(listener: (event: StackEvent<T>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit an event
   * @param type Event type
   * @param data Event data
   */
  private emit(
    type: StackEvent<T>["type"],
    data: Partial<StackEvent<T>>,
  ): void {
    const event: StackEvent<T> = {
      type,
      timestamp: Date.now(),
      ...data,
    } as StackEvent<T>;

    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Iterator support
   */
  *[Symbol.iterator](): Iterator<T> {
    for (const item of this.items) {
      yield item;
    }
  }
}
