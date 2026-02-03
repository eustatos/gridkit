/**
 * Priority queue implementation for event scheduling.
 *
 * @module @gridkit/core/events/utils/priority
 */

import { EventPriority } from '../types';

type Task = () => void;

interface QueuedTask {
  task: Task;
  priority: EventPriority;
  addedAt: number;
}

/**
 * Priority queue interface.
 *
 * @public
 */
export interface PriorityQueue {
  /**
   * Add task to queue.
   */
  enqueue: (task: Task, priority: EventPriority) => void;

  /**
   * Process all tasks in priority order.
   */
  process: () => void;

  /**
   * Clear all tasks from queue.
   */
  clear: () => void;

  /**
   * Get total number of tasks in queue.
   */
  size: () => number;

  /**
   * Check if queue has more tasks to process.
   */
  hasNext: () => boolean;

  /**
   * Get next task to process.
   */
  next: () => Task | null;
}

/**
 * Create priority queue for event scheduling.
 *
 * @returns Priority queue instance
 *
 * @example
 * ```typescript
 * const queue = createPriorityQueue();
 * queue.enqueue(() => console.log('high priority'), EventPriority.HIGH);
 * queue.enqueue(() => console.log('low priority'), EventPriority.LOW);
 * queue.process(); // HIGH executes first, then LOW
 * ```
 *
 * @public
 */
export function createPriorityQueue(): PriorityQueue {
  const queues = new Map<EventPriority, QueuedTask[]>([
    [EventPriority.IMMEDIATE, []],
    [EventPriority.HIGH, []],
    [EventPriority.NORMAL, []],
    [EventPriority.LOW, []],
  ]);

  let currentPriorityIndex = 0;
  const priorities = [
    EventPriority.IMMEDIATE,
    EventPriority.HIGH,
    EventPriority.NORMAL,
    EventPriority.LOW,
  ] as const;

  const getNextTask = (): QueuedTask | null => {
    for (let i = currentPriorityIndex; i < priorities.length; i++) {
      const priority = priorities[i];
      const queue = queues.get(priority)!;
      if (queue.length > 0) {
        return queue.shift()!;
      }
    }
    // Reset index after processing all tasks
    currentPriorityIndex = 0;
    return null;
  };

  return {
    enqueue(task: Task, priority: EventPriority): void {
      const queue = queues.get(priority);
      if (!queue) {
        throw new Error(`Invalid priority: ${priority}`);
      }

      queue.push({
        task,
        priority,
        addedAt: performance.now(),
      });
    },

    process(): void {
      // Process in priority order
      for (const priority of priorities) {
        const queue = queues.get(priority)!;

        while (queue.length > 0) {
          const item = queue.shift()!;
          try {
            item.task();
          } catch (error) {
            console.error('Error processing queued task:', error);
          }
        }
      }
    },

    clear(): void {
      for (const queue of queues.values()) {
        queue.length = 0;
      }
      currentPriorityIndex = 0;
    },

    size(): number {
      let total = 0;
      for (const queue of queues.values()) {
        total += queue.length;
      }
      return total;
    },

    hasNext(): boolean {
      for (const queue of queues.values()) {
        if (queue.length > 0) return true;
      }
      return false;
    },

    next(): Task | null {
      const nextTask = getNextTask();
      if (nextTask) {
        // Move to next priority if current is empty
        const queue = queues.get(nextTask.priority)!;
        if (queue.length === 0) {
          currentPriorityIndex = priorities.indexOf(nextTask.priority) + 1;
        }
        return nextTask.task;
      }
      return null;
    },
  };
}

// Declare requestIdleCallback for TypeScript
interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

type RequestIdleCallback = (
  callback: (deadline: IdleDeadline) => void,
  options?: { timeout?: number }
) => number;

/**
 * Create microtask-based scheduler for HIGH priority tasks.
 *
 * @param task - Task to schedule
 * @returns Promise that resolves when task completes
 *
 * @public
 */
export function scheduleHighPriority(task: Task): Promise<void> {
  return new Promise((resolve) => {
    queueMicrotask(() => {
      try {
        task();
      } catch (error) {
        console.error('Error in high priority task:', error);
      }
      resolve();
    });
  });
}

/**
 * Create idle callback-based scheduler for LOW priority tasks.
 * Uses setTimeout fallback if requestIdleCallback is not available.
 *
 * @param task - Task to schedule
 * @returns Promise that resolves when task completes
 *
 * @public
 */
export function scheduleLowPriority(task: Task): Promise<void> {
  return new Promise((resolve) => {
    // Check if we're in a browser environment with requestIdleCallback
    if (
      typeof globalThis !== 'undefined' &&
      'requestIdleCallback' in globalThis
    ) {
      const idleCallback = (globalThis as any)
        .requestIdleCallback as RequestIdleCallback;
      idleCallback(
        () => {
          try {
            task();
          } catch (error) {
            console.error('Error in low priority task:', error);
          }
          resolve();
        },
        { timeout: 100 } // Max wait time
      );
    } else {
      // Fallback to setTimeout if requestIdleCallback not available
      setTimeout(() => {
        try {
          task();
        } catch (error) {
          console.error('Error in low priority task:', error);
        }
        resolve();
      }, 0);
    }
  });
}
