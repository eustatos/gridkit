import { EventPriority } from '../types/base';

type Task = () => void;

interface QueuedTask {
  task: Task;
  priority: EventPriority;
  addedAt: number;
  sequence: number;
}

export interface PriorityQueue {
  enqueue: (task: Task, priority: EventPriority) => void;
  process: () => void;
  clear: () => void;
  size: () => number;
  isEmpty: () => boolean;
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

  let sequenceCounter = 0;

  const getTasksInPriorityOrder = (): QueuedTask[] => {
    const allTasks: QueuedTask[] = [];

    // Process in priority order: IMMEDIATE, HIGH, NORMAL, LOW
    const priorityOrder: EventPriority[] = [
      EventPriority.IMMEDIATE,
      EventPriority.HIGH,
      EventPriority.NORMAL,
      EventPriority.LOW,
    ];

    for (const priority of priorityOrder) {
      const queue = queues.get(priority);
      if (queue && queue.length > 0) {
        // For immediate priority, we don't need to sort by sequence number
        // as the order of execution is less critical for performance
        if (priority === EventPriority.IMMEDIATE) {
          allTasks.push(...queue);
        } else {
          // Sort by sequence number to maintain insertion order within same priority
          const sorted = [...queue].sort((a, b) => a.sequence - b.sequence);
          allTasks.push(...sorted);
        }
      }
    }

    return allTasks;
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
        sequence: sequenceCounter++,
      });
    },

    process(): void {
      // Get all tasks in priority order
      const tasksToProcess = getTasksInPriorityOrder();

      // Clear all queues
      for (const queue of queues.values()) {
        queue.length = 0;
      }

      // Execute all tasks
      for (const item of tasksToProcess) {
        try {
          item.task();
        } catch (error) {
          console.error('Error processing queued task:', error);
          // Continue processing remaining tasks even if one fails
        }
      }
    },

    clear(): void {
      for (const queue of queues.values()) {
        queue.length = 0;
      }
      sequenceCounter = 0;
    },

    size(): number {
      let total = 0;
      for (const queue of queues.values()) {
        total += queue.length;
      }
      return total;
    },

    isEmpty(): boolean {
      return this.size() === 0;
    },
  };
}

/**
 * Test utility for creating a mock priority queue
 * Useful for unit testing without actual async behavior
 */
export function createMockPriorityQueue(): PriorityQueue & {
  getQueue: (priority: EventPriority) => QueuedTask[];
} {
  const queues = new Map<EventPriority, QueuedTask[]>([
    [EventPriority.IMMEDIATE, []],
    [EventPriority.HIGH, []],
    [EventPriority.NORMAL, []],
    [EventPriority.LOW, []],
  ]);

  let sequenceCounter = 0;
  let processedTasks: QueuedTask[] = [];

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
        sequence: sequenceCounter++,
      });
    },

    process(): void {
      const tasksToProcess: QueuedTask[] = [];

      // Process in priority order
      const priorityOrder: EventPriority[] = [
        EventPriority.IMMEDIATE,
        EventPriority.HIGH,
        EventPriority.NORMAL,
        EventPriority.LOW,
      ];

      for (const priority of priorityOrder) {
        const queue = queues.get(priority)!;
        // For immediate priority, we don't need to sort by sequence number
        if (priority === EventPriority.IMMEDIATE) {
          tasksToProcess.push(...queue);
        } else {
          // Sort by sequence number
          const sorted = [...queue].sort((a, b) => a.sequence - b.sequence);
          tasksToProcess.push(...sorted);
        }
        queue.length = 0;
      }

      // Store processed tasks for testing
      processedTasks = tasksToProcess;

      // Execute all tasks
      for (const item of tasksToProcess) {
        try {
          item.task();
        } catch (error) {
          console.error('Error processing queued task:', error);
        }
      }
    },

    clear(): void {
      for (const queue of queues.values()) {
        queue.length = 0;
      }
      sequenceCounter = 0;
      processedTasks = [];
    },

    size(): number {
      let total = 0;
      for (const queue of queues.values()) {
        total += queue.length;
      }
      return total;
    },

    isEmpty(): boolean {
      return this.size() === 0;
    },

    // Test utility methods
    getQueue(priority: EventPriority): QueuedTask[] {
      return [...(queues.get(priority) || [])];
    },

    getProcessedTasks(): QueuedTask[] {
      return [...processedTasks];
    },
  };
}

/**
 * Priority queue with async task support
 * Useful for event buses that need to handle async handlers
 */
export function createAsyncPriorityQueue(): PriorityQueue & {
  processAsync: () => Promise<void>;
} {
  const baseQueue = createPriorityQueue();

  return {
    ...baseQueue,

    async processAsync(): Promise<void> {
      // For async processing, we need to handle promises
      // Since the original queue only handles sync tasks,
      // we'll create a wrapper that supports async

      // Note: This is a simplified version. In production,
      // you might want to implement proper async task handling
      baseQueue.process();
    },
  };
}

/**
 * Utility to check if priority is valid
 */
export function isValidPriority(priority: EventPriority): boolean {
  return [
    EventPriority.IMMEDIATE,
    EventPriority.HIGH,
    EventPriority.NORMAL,
    EventPriority.LOW,
  ].includes(priority);
}

/**
 * Utility to get priority name
 */
export function getPriorityName(priority: EventPriority): string {
  switch (priority) {
    case EventPriority.IMMEDIATE:
      return 'IMMEDIATE';
    case EventPriority.HIGH:
      return 'HIGH';
    case EventPriority.NORMAL:
      return 'NORMAL';
    case EventPriority.LOW:
      return 'LOW';
    default:
      return 'UNKNOWN';
  }
}