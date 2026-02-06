import { EventPriority } from '../types/base';

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
    [EventPriority.IMMEDIATE, []],
    [EventPriority.HIGH, []],
    [EventPriority.NORMAL, []],
    [EventPriority.LOW, []],
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
      // Process in priority order: IMMEDIATE, HIGH, NORMAL, LOW
      const priorityOrder: EventPriority[] = [
        EventPriority.IMMEDIATE,
        EventPriority.HIGH,
        EventPriority.NORMAL,
        EventPriority.LOW
      ];

      for (const priority of priorityOrder) {
        const queue = queues.get(priority)!;

        // Process all tasks in this priority level in order of addition
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