import type { EventPriority } from '../types';

type Task = () => void;

interface QueuedTask {
  task: Task;
  priority: EventPriority;
  addedAt: number;
}

export interface PriorityQueue {
  enqueue: (task: Task, priority: EventPriority) => void;
  process: () => void;
  clear: () => void;
  size: () => number;
}

/**
 * Create priority queue for event scheduling
 */
export function createPriorityQueue(): PriorityQueue {
  const queues = new Map<EventPriority, QueuedTask[]>([
    [0, []], // IMMEDIATE
    [1, []], // HIGH
    [2, []], // NORMAL
    [3, []], // LOW
  ]);

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
      for (const priority of [0, 1, 2, 3] as EventPriority[]) {
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
    },

    size(): number {
      let total = 0;
      for (const queue of queues.values()) {
        total += queue.length;
      }
      return total;
    },
  };
}